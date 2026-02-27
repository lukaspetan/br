import axios from 'axios';
import { ToolResult } from '../types';

export class DeployAgent {
  private deployerUrl: string;
  private backendUrl: string;

  constructor() {
    this.deployerUrl = process.env.DEPLOYER_URL || 'http://localhost:3002';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }

  async deploy(projectId: string): Promise<ToolResult> {
    try {
      console.log(`🚀 Starting deployment for project: ${projectId}`);

      const projectResponse = await axios.get(`${this.backendUrl}/api/v1/projects/${projectId}`, {
        headers: await this.getAuthHeaders()
      });

      const project = projectResponse.data;

      if (!project.generatedCode) {
        return {
          success: false,
          error: 'No code has been generated for this project yet'
        };
      }

      const deploymentResponse = await axios.post(
        `${this.deployerUrl}/deployments/${projectId}/build`,
        {},
        {
          headers: await this.getAuthHeaders()
        }
      );

      return {
        success: true,
        data: {
          deploymentId: deploymentResponse.data.deploymentId,
          status: 'deploying',
          message: 'Deployment started successfully'
        }
      };
    } catch (error: any) {
      console.error('Deploy error:', error.message);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<ToolResult> {
    try {
      const response = await axios.get(`${this.deployerUrl}/deployments/${deploymentId}/status`, {
        headers: await this.getAuthHeaders()
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async rollback(deploymentId: string): Promise<ToolResult> {
    try {
      const response = await axios.post(
        `${this.deployerUrl}/deployments/${deploymentId}/rollback`,
        {},
        {
          headers: await this.getAuthHeaders()
        }
      );

      return {
        success: true,
        data: {
          message: 'Rollback initiated successfully',
          deploymentId
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getLogs(deploymentId: string): Promise<ToolResult> {
    try {
      const response = await axios.get(`${this.deployerUrl}/deployments/${deploymentId}/logs`, {
        headers: await this.getAuthHeaders()
      });

      return {
        success: true,
        data: {
          logs: response.data.logs
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stop(projectId: string): Promise<ToolResult> {
    try {
      const response = await axios.post(
        `${this.deployerUrl}/deployments/${projectId}/stop`,
        {},
        {
          headers: await this.getAuthHeaders()
        }
      );

      return {
        success: true,
        data: {
          message: 'Application stopped successfully'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json'
    };
  }

  generateDemoDeploymentUrl(subdomain: string): string {
    return `https://${subdomain}.vortex44.com`;
  }
}
