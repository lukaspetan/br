import express, { Request, Response } from 'express';
import { DockerService } from './services/dockerService';
import { BuildService } from './services/buildService';
import { AutoFixer } from './services/autoFixer';

const app = express();
const dockerService = new DockerService();
const buildService = new BuildService();
const autoFixer = new AutoFixer();

app.use(express.json({ limit: '50mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/deployments/:id/build', async (req: Request, res: Response) => {
  const { id: deploymentId } = req.params;
  
  try {
    console.log(`🚀 Starting build for deployment: ${deploymentId}`);
    
    const deployment = await buildService.getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    await buildService.updateStatus(deploymentId, 'building', 'Starting build process...');

    const projectCode = await buildService.getProjectCode(deployment.projectId);
    
    if (!projectCode) {
      await buildService.updateStatus(deploymentId, 'failed', 'No code found for project');
      return res.status(400).json({ error: 'No code to build' });
    }

    const extractedFiles = buildService.extractFiles(projectCode);
    
    const buildResult = await dockerService.buildContainer(
      deploymentId,
      extractedFiles,
      deployment.subdomain
    );

    if (!buildResult.success) {
      const fixedResult = await autoFixer.detectAndFix(
        buildResult.logs,
        projectCode
      );

      if (fixedResult.wasFixed) {
        console.log('🔧 Attempting auto-fix...');
        
        await buildService.updateStatus(
          deploymentId,
          'building',
          `Auto-fixing errors...\n${buildResult.logs}`
        );

        const retryResult = await dockerService.buildContainer(
          deploymentId,
          buildService.extractFiles(fixedResult.fixedCode),
          deployment.subdomain
        );

        if (!retryResult.success) {
          await buildService.updateStatus(deploymentId, 'failed', retryResult.logs);
          return res.status(500).json({ error: 'Build failed after auto-fix', logs: retryResult.logs });
        }
        
        Object.assign(buildResult, retryResult);
      } else {
        await buildService.updateStatus(deploymentId, 'failed', buildResult.logs);
        return res.status(500).json({ error: 'Build failed', logs: buildResult.logs });
      }
    }

    const containerResult = await dockerService.runContainer(
      deploymentId,
      deployment.subdomain,
      buildResult.imageId
    );

    if (!containerResult.success) {
      await buildService.updateStatus(deploymentId, 'failed', containerResult.logs);
      return res.status(500).json({ error: 'Failed to run container', logs: containerResult.logs });
    }

    await buildService.updateStatus(
      deploymentId,
      'active',
      buildResult.logs,
      {
        url: `https://${deployment.subdomain}.vortex44.com`,
        containerId: containerResult.containerId,
        port: containerResult.port,
      }
    );

    console.log(`✅ Deployment ${deploymentId} successful!`);
    
    res.json({
      success: true,
      url: `https://${deployment.subdomain}.vortex44.com`,
      containerId: containerResult.containerId,
    });
  } catch (error: any) {
    console.error('Build error:', error);
    await buildService.updateStatus(deploymentId, 'failed', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/deployments/:id/stop', async (req: Request, res: Response) => {
  const { id: deploymentId } = req.params;
  
  try {
    await dockerService.stopContainer(deploymentId);
    await buildService.updateStatus(deploymentId, 'stopped', 'Container stopped');
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/deployments/:id/rollback', async (req: Request, res: Response) => {
  const { id: deploymentId } = req.params;
  
  try {
    const deployment = await buildService.getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const previousDeployment = await buildService.getPreviousDeployment(deployment.projectId);
    if (!previousDeployment) {
      return res.status(404).json({ error: 'No previous deployment found' });
    }

    await dockerService.stopContainer(deploymentId);
    
    await dockerService.runContainer(
      deploymentId,
      deployment.subdomain,
      previousDeployment.imageId
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/deployments/:id/logs', async (req: Request, res: Response) => {
  const { id: deploymentId } = req.params;
  
  try {
    const logs = await dockerService.getContainerLogs(deploymentId);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Vortex44 Deployer running on port ${PORT}`);
});
