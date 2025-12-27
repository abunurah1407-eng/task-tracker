// Generate all chart reports as separate image files
const { Pool } = require('pg');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Create output directory
const outputDir = path.join(__dirname, '../../../reports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Chart configuration
const width = 1200;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

async function generateReports() {
  try {
    console.log('Fetching data from database...');
    
    // Fetch all tasks
    const tasksResult = await pool.query(`
      SELECT id, service, engineer, week, month, year, status, priority, description
      FROM tasks
      WHERE deleted_at IS NULL
      ORDER BY year DESC, month, week
    `);
    const tasks = tasksResult.rows;

    // Fetch engineers
    const engineersResult = await pool.query('SELECT name, color FROM engineers ORDER BY name');
    const engineers = engineersResult.rows;

    // Fetch services
    const servicesResult = await pool.query('SELECT name FROM services ORDER BY name');
    const services = servicesResult.rows.map(s => s.name);

    console.log(`Found ${tasks.length} tasks, ${engineers.length} engineers, ${services.length} services`);

    // Prepare data
    const currentYear = new Date().getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    // Engineer Task Distribution
    const engineerChartData = engineers.map(eng => {
      const engTasks = tasks.filter(t => t.engineer === eng.name);
      return {
        name: eng.name,
        total: engTasks.length,
        pending: engTasks.filter(t => t.status === 'pending').length,
        inProgress: engTasks.filter(t => t.status === 'in-progress').length,
        completed: engTasks.filter(t => t.status === 'completed').length,
      };
    }).filter(eng => eng.total > 0);

    // Monthly Task Trend
    const currentYearTasks = tasks.filter(t => t.year === currentYear);
    const monthlyData = currentYearTasks.reduce((acc, task) => {
      const key = `${task.month} ${task.year}`;
      if (!acc[key]) {
        acc[key] = { month: task.month, tasks: 0, completed: 0 };
      }
      acc[key].tasks += 1;
      if (task.status === 'completed') {
        acc[key].completed += 1;
      }
      return acc;
    }, {});

    const monthlyChartData = monthNames.map(month => {
      const key = `${month} ${currentYear}`;
      return monthlyData[key] || { month, tasks: 0, completed: 0 };
    });

    // Status Distribution
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const statusPieData = [
      { name: 'Pending', value: pendingTasks, color: '#9ca3af' },
      { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
      { name: 'Completed', value: completedTasks, color: '#10b981' },
    ].filter(d => d.value > 0);

    // Priority Distribution
    const priorityPieData = [
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#6b7280' },
    ].filter(d => d.value > 0);

    // Top Services
    const serviceCounts = services.map(service => ({
      name: service,
      count: tasks.filter(t => t.service === service).length,
    })).filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Engineer Completion Rate
    const engineerPerformance = engineers.map(eng => {
      const engTasks = tasks.filter(t => t.engineer === eng.name);
      const completed = engTasks.filter(t => t.status === 'completed').length;
      const completionRate = engTasks.length > 0 ? (completed / engTasks.length) * 100 : 0;
      return {
        name: eng.name,
        completionRate: Math.round(completionRate),
        total: engTasks.length,
      };
    }).filter(item => item.total > 0);

    console.log('Generating charts...');

    // 1. Engineer Task Distribution
    const engineerChartConfig = {
      type: 'bar',
      data: {
        labels: engineerChartData.map(e => e.name),
        datasets: [
          {
            label: 'Pending',
            data: engineerChartData.map(e => e.pending),
            backgroundColor: '#9ca3af',
          },
          {
            label: 'In Progress',
            data: engineerChartData.map(e => e.inProgress),
            backgroundColor: '#3b82f6',
          },
          {
            label: 'Completed',
            data: engineerChartData.map(e => e.completed),
            backgroundColor: '#10b981',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Engineer Task Distribution',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 200,
            },
          },
        },
      },
    };
    const engineerImage = await chartJSNodeCanvas.renderToBuffer(engineerChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Engineer_Task_Distribution.png'), engineerImage);
    console.log('✓ Generated Engineer Task Distribution.png');

    // 2. Monthly Task Trend
    const monthlyChartConfig = {
      type: 'line',
      data: {
        labels: monthlyChartData.map(m => m.month.substring(0, 3)),
        datasets: [
          {
            label: 'Total Tasks',
            data: monthlyChartData.map(m => m.tasks),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Completed',
            data: monthlyChartData.map(m => m.completed),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Monthly Task Trend (${currentYear})`,
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 200,
            },
          },
        },
      },
    };
    const monthlyImage = await chartJSNodeCanvas.renderToBuffer(monthlyChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Monthly_Task_Trend.png'), monthlyImage);
    console.log('✓ Generated Monthly Task Trend.png');

    // 3. Status Distribution
    const statusChartConfig = {
      type: 'pie',
      data: {
        labels: statusPieData.map(d => d.name),
        datasets: [{
          data: statusPieData.map(d => d.value),
          backgroundColor: statusPieData.map(d => d.color),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Task Status Distribution',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percent}%)`;
              },
            },
          },
        },
      },
    };
    const statusImage = await chartJSNodeCanvas.renderToBuffer(statusChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Task_Status_Distribution.png'), statusImage);
    console.log('✓ Generated Task Status Distribution.png');

    // 4. Priority Distribution
    const priorityChartConfig = {
      type: 'pie',
      data: {
        labels: priorityPieData.map(d => d.name),
        datasets: [{
          data: priorityPieData.map(d => d.value),
          backgroundColor: priorityPieData.map(d => d.color),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Priority Distribution',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percent}%)`;
              },
            },
          },
        },
      },
    };
    const priorityImage = await chartJSNodeCanvas.renderToBuffer(priorityChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Priority_Distribution.png'), priorityImage);
    console.log('✓ Generated Priority Distribution.png');

    // 5. Engineer Completion Rate
    const completionChartConfig = {
      type: 'bar',
      data: {
        labels: engineerPerformance.map(e => e.name),
        datasets: [{
          label: 'Completion Rate (%)',
          data: engineerPerformance.map(e => e.completionRate),
          backgroundColor: '#8b5cf6',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Engineer Completion Rate',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
            },
          },
        },
      },
    };
    const completionImage = await chartJSNodeCanvas.renderToBuffer(completionChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Engineer_Completion_Rate.png'), completionImage);
    console.log('✓ Generated Engineer Completion Rate.png');

    // 6. Top Services
    const serviceChartConfig = {
      type: 'bar',
      data: {
        labels: serviceCounts.map(s => s.name),
        datasets: [{
          label: 'Task Count',
          data: serviceCounts.map(s => s.count),
          backgroundColor: '#ec4899',
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Top Services by Task Count',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      },
    };
    const serviceImage = await chartJSNodeCanvas.renderToBuffer(serviceChartConfig);
    fs.writeFileSync(path.join(outputDir, 'Top_Services_by_Task_Count.png'), serviceImage);
    console.log('✓ Generated Top Services by Task Count.png');

    console.log(`\n✅ All reports generated successfully in: ${outputDir}`);
    console.log(`Generated ${6} chart images.`);

  } catch (error) {
    console.error('Error generating reports:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

generateReports();


