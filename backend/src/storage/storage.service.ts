import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: `http://${this.configService.get('MINIO_ENDPOINT') || 'localhost'}:${this.configService.get('MINIO_PORT') || 9000}`,
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY') || 'vortex44',
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY') || 'vortex44',
      },
      forcePathStyle: true,
    });

    this.bucketName = this.configService.get('MINIO_BUCKET') || 'vortex44-projects';
  }

  async storeProjectCode(projectId: string, code: string): Promise<string> {
    const key = `projects/${projectId}/code.json`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify({ code, generatedAt: new Date().toISOString() }),
        ContentType: 'application/json',
      },
    });

    await upload.done();
    return key;
  }

  async getProjectCode(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response from storage');
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      return data.code;
    } catch (error) {
      console.error('Error getting project code:', error.message);
      throw error;
    }
  }

  async uploadFile(key: string, body: Buffer | string, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    await upload.done();
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    return `http://${this.configService.get('MINIO_ENDPOINT') || 'localhost'}:${this.configService.get('MINIO_PORT') || 9000}/${this.bucketName}/${key}`;
  }
}
