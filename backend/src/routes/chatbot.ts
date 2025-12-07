import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Month name variations
const monthVariations: Record<string, string[]> = {
  'january': ['january', 'jan'],
  'february': ['february', 'feb'],
  'march': ['march', 'mar'],
  'april': ['april', 'apr'],
  'may': ['may'],
  'june': ['june', 'jun'],
  'july': ['july', 'jul'],
  'august': ['august', 'aug'],
  'september': ['september', 'sep', 'sept'],
  'october': ['october', 'oct'],
  'november': ['november', 'nov'],
  'december': ['december', 'dec'],
};

// Extract month from text
function extractMonth(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [month, variations] of Object.entries(monthVariations)) {
    for (const variation of variations) {
      if (lowerText.includes(variation)) {
        return month.charAt(0).toUpperCase() + month.slice(1);
      }
    }
  }
  return null;
}

// Extract year from text
function extractYear(text: string): number | null {
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }
  return null;
}

// Extract engineer name from text (check against known engineers)
async function extractEngineer(text: string): Promise<string | null> {
  const engineersResult = await pool.query('SELECT name FROM engineers');
  const engineerNames = engineersResult.rows.map((r: any) => r.name.toLowerCase());
  
  const lowerText = text.toLowerCase();
  for (const name of engineerNames) {
    if (lowerText.includes(name.toLowerCase())) {
      const exactMatch = engineersResult.rows.find((r: any) => 
        r.name.toLowerCase() === name.toLowerCase()
      );
      return exactMatch ? exactMatch.name : null;
    }
  }
  return null;
}

// Extract service name from text
async function extractService(text: string): Promise<string | null> {
  const servicesResult = await pool.query('SELECT name FROM services');
  const serviceNames = servicesResult.rows.map((r: any) => r.name.toLowerCase());
  
  const lowerText = text.toLowerCase();
  for (const name of serviceNames) {
    if (lowerText.includes(name.toLowerCase())) {
      const exactMatch = servicesResult.rows.find((r: any) => 
        r.name.toLowerCase() === name.toLowerCase()
      );
      return exactMatch ? exactMatch.name : null;
    }
  }
  return null;
}

// Extract status from text
function extractStatus(text: string): string | null {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('completed') || lowerText.includes('done') || lowerText.includes('finished')) {
    return 'completed';
  }
  if (lowerText.includes('in progress') || lowerText.includes('in-progress') || lowerText.includes('progress')) {
    return 'in-progress';
  }
  if (lowerText.includes('pending') || lowerText.includes('not started')) {
    return 'pending';
  }
  return null;
}

// Process chatbot query
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const lowerQuery = query.toLowerCase();
    
    // Extract entities
    const month = extractMonth(query);
    const year = extractYear(query) || new Date().getFullYear();
    const engineer = await extractEngineer(query);
    const service = await extractService(query);
    const status = extractStatus(query);

    // Build SQL query
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (year) {
      sql += ` AND year = $${paramIndex++}`;
      params.push(year);
    }

    if (month) {
      sql += ` AND month = $${paramIndex++}`;
      params.push(month);
    }

    if (engineer) {
      sql += ` AND engineer = $${paramIndex++}`;
      params.push(engineer);
    }

    if (service) {
      sql += ` AND service = $${paramIndex++}`;
      params.push(service);
    }

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY year DESC, month, engineer, service';

    const result = await pool.query(sql, params);
    const tasks = result.rows;

    // Initialize response variable
    let response = '';

    // Check for analytical/statistical questions first
    if (lowerQuery.includes('highest') || lowerQuery.includes('most') || lowerQuery.includes('top') || 
        lowerQuery.includes('lowest') || lowerQuery.includes('least') || lowerQuery.includes('best') ||
        lowerQuery.includes('worst') || lowerQuery.includes('largest') || lowerQuery.includes('smallest')) {
      
      // Service with most tasks
      if (lowerQuery.includes('service') && (lowerQuery.includes('most') || lowerQuery.includes('highest') || lowerQuery.includes('top'))) {
        const serviceStats = await pool.query(
          `SELECT service, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY service 
           ORDER BY count DESC 
           LIMIT 1`,
          month ? [year, month] : [year]
        );
        
        if (serviceStats.rows.length > 0) {
          const topService = serviceStats.rows[0];
          response = `The service with the most tasks${month ? ` in ${month}` : ''} ${year} is "${topService.service}" with ${topService.count} task${topService.count !== 1 ? 's' : ''}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      // Engineer with most tasks
      else if ((lowerQuery.includes('engineer') || lowerQuery.includes('who')) && 
               (lowerQuery.includes('most') || lowerQuery.includes('highest') || lowerQuery.includes('top'))) {
        const engineerStats = await pool.query(
          `SELECT engineer, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY engineer 
           ORDER BY count DESC 
           LIMIT 1`,
          month ? [year, month] : [year]
        );
        
        if (engineerStats.rows.length > 0) {
          const topEngineer = engineerStats.rows[0];
          response = `${topEngineer.engineer} completed the most tasks${month ? ` in ${month}` : ''} ${year} with ${topEngineer.count} task${topEngineer.count !== 1 ? 's' : ''}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      // Month with most tasks
      else if (lowerQuery.includes('month') && (lowerQuery.includes('most') || lowerQuery.includes('highest') || lowerQuery.includes('top'))) {
        const monthStats = await pool.query(
          `SELECT month, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1
           GROUP BY month 
           ORDER BY count DESC 
           LIMIT 1`,
          [year]
        );
        
        if (monthStats.rows.length > 0) {
          const topMonth = monthStats.rows[0];
          response = `The month with the most tasks in ${year} is ${topMonth.month} with ${topMonth.count} task${topMonth.count !== 1 ? 's' : ''}.`;
        } else {
          response = `No tasks found in ${year}.`;
        }
      }
      // Top services list
      else if (lowerQuery.includes('service') && lowerQuery.includes('top')) {
        const limitMatch = lowerQuery.match(/top\s*(\d+)/);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 5;
        
        const serviceStats = await pool.query(
          `SELECT service, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY service 
           ORDER BY count DESC 
           LIMIT $${month ? 3 : 2}`,
          month ? [year, month, limit] : [year, limit]
        );
        
        if (serviceStats.rows.length > 0) {
          response = `Top ${serviceStats.rows.length} service${serviceStats.rows.length !== 1 ? 's' : ''}${month ? ` in ${month}` : ''} ${year}:\n\n`;
          serviceStats.rows.forEach((row, index) => {
            response += `${index + 1}. ${row.service}: ${row.count} task${row.count !== 1 ? 's' : ''}\n`;
          });
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      // Top engineers list
      else if ((lowerQuery.includes('engineer') || lowerQuery.includes('who')) && lowerQuery.includes('top')) {
        const limitMatch = lowerQuery.match(/top\s*(\d+)/);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 5;
        
        const engineerStats = await pool.query(
          `SELECT engineer, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY engineer 
           ORDER BY count DESC 
           LIMIT $${month ? 3 : 2}`,
          month ? [year, month, limit] : [year, limit]
        );
        
        if (engineerStats.rows.length > 0) {
          response = `Top ${engineerStats.rows.length} engineer${engineerStats.rows.length !== 1 ? 's' : ''}${month ? ` in ${month}` : ''} ${year}:\n\n`;
          engineerStats.rows.forEach((row, index) => {
            response += `${index + 1}. ${row.engineer}: ${row.count} task${row.count !== 1 ? 's' : ''}\n`;
          });
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      // Service with least tasks
      else if (lowerQuery.includes('service') && (lowerQuery.includes('least') || lowerQuery.includes('lowest'))) {
        const serviceStats = await pool.query(
          `SELECT service, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY service 
           ORDER BY count ASC 
           LIMIT 1`,
          month ? [year, month] : [year]
        );
        
        if (serviceStats.rows.length > 0) {
          const leastService = serviceStats.rows[0];
          response = `The service with the least tasks${month ? ` in ${month}` : ''} ${year} is "${leastService.service}" with ${leastService.count} task${leastService.count !== 1 ? 's' : ''}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      // Engineer with least tasks
      else if ((lowerQuery.includes('engineer') || lowerQuery.includes('who')) && 
               (lowerQuery.includes('least') || lowerQuery.includes('lowest'))) {
        const engineerStats = await pool.query(
          `SELECT engineer, COUNT(*) as count 
           FROM tasks 
           WHERE year = $1 ${month ? 'AND month = $2' : ''}
           GROUP BY engineer 
           ORDER BY count ASC 
           LIMIT 1`,
          month ? [year, month] : [year]
        );
        
        if (engineerStats.rows.length > 0) {
          const leastEngineer = engineerStats.rows[0];
          response = `${leastEngineer.engineer} has the least tasks${month ? ` in ${month}` : ''} ${year} with ${leastEngineer.count} task${leastEngineer.count !== 1 ? 's' : ''}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      }
      else {
        response = 'I can help you find the service or engineer with the most/least tasks. Try asking "What service has the most tasks?" or "Who did the most tasks?"';
      }
    }
    // Statistics and summaries
    else if (lowerQuery.includes('statistics') || lowerQuery.includes('stats') || lowerQuery.includes('summary') || 
             lowerQuery.includes('overview') || lowerQuery.includes('total')) {
      const totalTasks = await pool.query(
        `SELECT COUNT(*) as total FROM tasks WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      const statusStats = await pool.query(
        `SELECT status, COUNT(*) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}
         GROUP BY status`,
        month ? [year, month] : [year]
      );
      
      const serviceCount = await pool.query(
        `SELECT COUNT(DISTINCT service) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      const engineerCount = await pool.query(
        `SELECT COUNT(DISTINCT engineer) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      response = `Statistics${month ? ` for ${month}` : ''} ${year}:\n\n`;
      response += `Total Tasks: ${totalTasks.rows[0].total}\n`;
      response += `Services: ${serviceCount.rows[0].count}\n`;
      response += `Engineers: ${engineerCount.rows[0].count}\n\n`;
      response += `Status Breakdown:\n`;
      statusStats.rows.forEach((row: any) => {
        response += `• ${row.status}: ${row.count}\n`;
      });
    }
    // Generate response based on question type
    else if (lowerQuery.includes('who') || lowerQuery.includes('which engineer')) {
      // Who did what questions
      if (service && month) {
        const engineers = [...new Set(tasks.map((t: any) => t.engineer))];
        if (engineers.length === 0) {
          response = `No engineers worked on "${service}" in ${month} ${year}.`;
        } else if (engineers.length === 1) {
          response = `${engineers[0]} worked on "${service}" in ${month} ${year} (${tasks.length} task${tasks.length !== 1 ? 's' : ''}).`;
        } else {
          response = `The following engineers worked on "${service}" in ${month} ${year}: ${engineers.join(', ')}. Total: ${tasks.length} task${tasks.length !== 1 ? 's' : ''}.`;
        }
      } else if (service) {
        const engineers = [...new Set(tasks.map((t: any) => t.engineer))];
        if (engineers.length === 0) {
          response = `No engineers worked on "${service}" in ${year}.`;
        } else {
          response = `The following engineers worked on "${service}" in ${year}: ${engineers.join(', ')}. Total: ${tasks.length} task${tasks.length !== 1 ? 's' : ''}.`;
        }
      } else {
        response = 'Please specify a service or month to find out who worked on it.';
      }
    } else if (lowerQuery.includes('what') || lowerQuery.includes('which tasks')) {
      // What tasks questions
      if (engineer && month) {
        const services = [...new Set(tasks.map((t: any) => t.service))];
        if (tasks.length === 0) {
          response = `${engineer} had no tasks in ${month} ${year}.`;
        } else {
          response = `${engineer} worked on ${tasks.length} task${tasks.length !== 1 ? 's' : ''} in ${month} ${year}: ${services.join(', ')}.`;
        }
      } else if (engineer) {
        const services = [...new Set(tasks.map((t: any) => t.service))];
        if (tasks.length === 0) {
          response = `${engineer} had no tasks in ${year}.`;
        } else {
          response = `${engineer} worked on ${tasks.length} task${tasks.length !== 1 ? 's' : ''} in ${year} across ${services.length} service${services.length !== 1 ? 's' : ''}: ${services.join(', ')}.`;
        }
      } else if (service && month) {
        if (tasks.length === 0) {
          response = `No tasks for "${service}" in ${month} ${year}.`;
        } else {
          response = `There ${tasks.length === 1 ? 'was' : 'were'} ${tasks.length} task${tasks.length !== 1 ? 's' : ''} for "${service}" in ${month} ${year}.`;
        }
      } else {
        response = 'Please specify an engineer, service, or month to find tasks.';
      }
    } 
    // Statistics and summaries
    else if (lowerQuery.includes('statistics') || lowerQuery.includes('stats') || lowerQuery.includes('summary') || 
             lowerQuery.includes('overview') || lowerQuery.includes('total')) {
      const totalTasks = await pool.query(
        `SELECT COUNT(*) as total FROM tasks WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      const statusStats = await pool.query(
        `SELECT status, COUNT(*) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}
         GROUP BY status`,
        month ? [year, month] : [year]
      );
      
      const serviceCount = await pool.query(
        `SELECT COUNT(DISTINCT service) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      const engineerCount = await pool.query(
        `SELECT COUNT(DISTINCT engineer) as count 
         FROM tasks 
         WHERE year = $1 ${month ? 'AND month = $2' : ''}`,
        month ? [year, month] : [year]
      );
      
      response = `Statistics${month ? ` for ${month}` : ''} ${year}:\n\n`;
      response += `Total Tasks: ${totalTasks.rows[0].total}\n`;
      response += `Services: ${serviceCount.rows[0].count}\n`;
      response += `Engineers: ${engineerCount.rows[0].count}\n\n`;
      response += `Status Breakdown:\n`;
      statusStats.rows.forEach((row: any) => {
        response += `• ${row.status}: ${row.count}\n`;
      });
    }
    else if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
      // Count questions
      if (tasks.length === 0) {
        response = `No tasks found matching your criteria.`;
      } else {
        let details: string[] = [];
        if (engineer) details.push(`engineer: ${engineer}`);
        if (service) details.push(`service: ${service}`);
        if (month) details.push(`month: ${month}`);
        if (year) details.push(`year: ${year}`);
        if (status) details.push(`status: ${status}`);
        
        response = `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
        if (details.length > 0) {
          response += ` (${details.join(', ')})`;
        }
        response += '.';
      }
    } else if (lowerQuery.includes('list') || lowerQuery.includes('show')) {
      // List questions
      if (tasks.length === 0) {
        response = 'No tasks found matching your criteria.';
      } else {
        response = `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}:\n\n`;
        const grouped = tasks.reduce((acc: any, task: any) => {
          const key = `${task.engineer} - ${task.service} - ${task.month}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(task);
          return acc;
        }, {});
        
        response += Object.entries(grouped).map(([key, taskList]: [string, any]) => {
          return `• ${key}: ${taskList.length} task${taskList.length !== 1 ? 's' : ''} (${taskList[0].status})`;
        }).join('\n');
      }
    } 
    // Average tasks per engineer/service
    else if (lowerQuery.includes('average') || lowerQuery.includes('avg')) {
      if (lowerQuery.includes('engineer')) {
        const avgStats = await pool.query(
          `SELECT AVG(task_count) as avg 
           FROM (
             SELECT engineer, COUNT(*) as task_count 
             FROM tasks 
             WHERE year = $1 ${month ? 'AND month = $2' : ''}
             GROUP BY engineer
           ) as engineer_stats`,
          month ? [year, month] : [year]
        );
        
        if (avgStats.rows[0].avg) {
          const avg = Math.round(parseFloat(avgStats.rows[0].avg));
          response = `The average number of tasks per engineer${month ? ` in ${month}` : ''} ${year} is ${avg}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      } else if (lowerQuery.includes('service')) {
        const avgStats = await pool.query(
          `SELECT AVG(task_count) as avg 
           FROM (
             SELECT service, COUNT(*) as task_count 
             FROM tasks 
             WHERE year = $1 ${month ? 'AND month = $2' : ''}
             GROUP BY service
           ) as service_stats`,
          month ? [year, month] : [year]
        );
        
        if (avgStats.rows[0].avg) {
          const avg = Math.round(parseFloat(avgStats.rows[0].avg));
          response = `The average number of tasks per service${month ? ` in ${month}` : ''} ${year} is ${avg}.`;
        } else {
          response = `No tasks found${month ? ` in ${month}` : ''} ${year}.`;
        }
      } else {
        response = 'Please specify if you want average tasks per engineer or per service.';
      }
    }
    else {
      // Generic response
      if (tasks.length === 0) {
        response = 'No tasks found matching your criteria.';
      } else {
        response = `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''} matching your query.`;
        if (engineer) response += ` Engineer: ${engineer}.`;
        if (service) response += ` Service: ${service}.`;
        if (month) response += ` Month: ${month}.`;
        if (status) response += ` Status: ${status}.`;
      }
    }
    
    // Set response variable for analytical questions
    if (!response) {
      response = 'I can help you find information about tasks. Try asking questions like:\n\n• "What service has the most tasks?"\n• "Who did the most tasks?"\n• "Show me statistics for 2025"\n• "What is the average tasks per engineer?"';
    }

    // For analytical questions, we might not have tasks array
    const responseTasks = tasks && tasks.length > 0 ? tasks.slice(0, 50) : [];
    
    res.json({
      response,
      tasks: responseTasks,
      count: tasks ? tasks.length : 0,
      filters: {
        engineer,
        service,
        month,
        year,
        status,
      },
    });
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

export default router;

