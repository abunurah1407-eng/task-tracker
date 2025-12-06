# Deployment Guide

This guide covers deploying the Task Tracker application to production.

## Prerequisites

- Production server (Linux/Windows)
- PostgreSQL database (local or cloud)
- Domain name (optional)
- SSL certificate (for HTTPS)

## Backend Deployment

### Option 1: Traditional Server

1. **Build the application:**
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Set up environment variables:**
   ```env
   NODE_ENV=production
   PORT=3001
   DB_HOST=your_db_host
   DB_PORT=5432
   DB_NAME=task_tracker
   DB_USER=postgres
   DB_PASSWORD=secure_password
   JWT_SECRET=very_secure_random_string
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start with PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name task-tracker-api
   pm2 save
   pm2 startup
   ```

### Option 2: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["node", "dist/index.js"]
   ```

2. **Build and run:**
   ```bash
   docker build -t task-tracker-api .
   docker run -d -p 3001:3001 --env-file .env task-tracker-api
   ```

### Option 3: Cloud Platforms

#### Heroku

```bash
heroku create task-tracker-api
heroku addons:create heroku-postgresql
git push heroku main
```

#### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy

#### AWS (EC2 + RDS)

1. Launch EC2 instance
2. Set up RDS PostgreSQL
3. Deploy application
4. Configure security groups

## Frontend Deployment

### Option 1: Static Hosting

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to hosting:**
   - **Vercel**: `vercel deploy`
   - **Netlify**: Drag and drop `dist` folder
   - **AWS S3**: Upload `dist` folder to S3 bucket

3. **Set environment variable:**
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   ```

### Option 2: Nginx

1. **Build and copy files:**
   ```bash
   npm run build
   cp -r dist/* /var/www/task-tracker/
   ```

2. **Nginx configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/task-tracker;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Setup

### Production Database

1. **Create production database:**
   ```sql
   CREATE DATABASE task_tracker_prod;
   ```

2. **Run migrations:**
   ```bash
   DB_NAME=task_tracker_prod npm run migrate
   ```

3. **Seed initial data (optional):**
   ```bash
   DB_NAME=task_tracker_prod npm run seed
   ```

### Database Backups

Set up automated backups:

```bash
# Daily backup script
pg_dump -U postgres task_tracker > backup_$(date +%Y%m%d).sql
```

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Environment variables secured

## Environment Variables

### Backend (.env)

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=generate_strong_random_string_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (.env.production)

```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Monitoring

### Application Monitoring

- **PM2 Monitoring**: `pm2 monit`
- **Logging**: Set up centralized logging
- **Error Tracking**: Sentry, Rollbar, or similar

### Database Monitoring

- Monitor connection pool
- Track slow queries
- Monitor disk usage

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Nginx or cloud load balancer
2. **Multiple API Instances**: Run multiple backend instances
3. **Database Replication**: Read replicas for read-heavy operations

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Add caching layer (Redis)

## SSL/HTTPS

### Let's Encrypt (Free)

```bash
sudo certbot --nginx -d yourdomain.com
```

### Cloud Provider SSL

- AWS: Certificate Manager
- Cloudflare: Free SSL
- Azure: App Service Certificates

## Backup Strategy

1. **Database Backups**: Daily automated backups
2. **Code Backups**: Git repository
3. **Configuration Backups**: Secure storage of .env files
4. **Test Restores**: Regularly test backup restoration

## Post-Deployment

1. **Health Check**: Verify `/health` endpoint
2. **Test Login**: Verify authentication works
3. **Test CRUD**: Verify all operations work
4. **Monitor Logs**: Check for errors
5. **Performance Test**: Load testing

## Troubleshooting Production Issues

### Application Won't Start

- Check environment variables
- Verify database connection
- Check port availability
- Review application logs

### Database Connection Issues

- Verify database is running
- Check firewall rules
- Verify credentials
- Check network connectivity

### Performance Issues

- Monitor database queries
- Check server resources
- Review application logs
- Consider caching

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate secrets
- Monitor disk space
- Review logs for errors
- Update security patches

### Updates

1. Pull latest code
2. Run migrations
3. Build application
4. Restart services
5. Verify functionality

