# Push Backend Image to Docker Hub

## Quick Steps

1. **Open PowerShell in the project directory**

2. **Login to Docker Hub:**
   ```powershell
   docker login
   ```
   Enter your Docker Hub username and password when prompted.

3. **Tag the backend image** (replace `YOUR_USERNAME` with your Docker Hub username):
   ```powershell
   docker tag task-tracker-backend:latest YOUR_USERNAME/task-tracker-backend:latest
   docker tag task-tracker-backend:latest YOUR_USERNAME/task-tracker-backend:v1.0.0
   ```

4. **Push the images to Docker Hub:**
   ```powershell
   docker push YOUR_USERNAME/task-tracker-backend:latest
   docker push YOUR_USERNAME/task-tracker-backend:v1.0.0
   ```

## Example

If your Docker Hub username is `johndoe`, the commands would be:

```powershell
docker login
docker tag task-tracker-backend:latest johndoe/task-tracker-backend:latest
docker tag task-tracker-backend:latest johndoe/task-tracker-backend:v1.0.0
docker push johndoe/task-tracker-backend:latest
docker push johndoe/task-tracker-backend:v1.0.0
```

## Verification

After pushing, you can verify the images are on Docker Hub by visiting:
- `https://hub.docker.com/r/YOUR_USERNAME/task-tracker-backend`

## Next Steps

Once the backend image is pushed, update your `.env` file or deployment script with your Docker Hub username, and the Linux server deployment will pull everything from Docker Hub!

