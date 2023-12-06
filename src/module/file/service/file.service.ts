import { Provide } from '@midwayjs/decorator';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseService } from '@/common/base.service';
import { FileEntity } from '../entity/file.entity';
import { MinioConfig } from '@/interface';
import { Config, Inject } from '@midwayjs/core';
import { MinioClient } from '@/autoload/minio.autoload';
import { UploadFileInfo } from '@midwayjs/upload';

@Provide()
export class FileService extends BaseService<FileEntity> {
  @InjectEntityModel(FileEntity)
  fileModel: Repository<FileEntity>;

  @Inject()
  minioClient: MinioClient;

  @Config('minio')
  minioConfig: MinioConfig;

  @InjectDataSource()
  defaultDataSource: DataSource;

  getModel(): Repository<FileEntity> {
    return this.fileModel;
  }

  // 上传方法
  async upload(file: UploadFileInfo<string>) {
    // 生成文件名。因为文件名可能重复，这里手动拼了时间戳。
    const fileName = `${new Date().getTime()}_${file.filename}`;

    // 这里使用了typeorm的事务，如果文件信息存表失败的情况下，就不用上传到minio服务器了，如果后面上传文件失败了，前面插入的数据，也会自动会滚。保证了不会有脏数据。
    return await this.defaultDataSource.transaction(async manager => {
      const fileEntity = new FileEntity();
      fileEntity.fileName = fileName;
      fileEntity.filePath = `/file/${this.minioConfig.bucketName}/${fileName}`;
      await manager.save(FileEntity, fileEntity);

      await this.minioClient.fPutObject(
        this.minioConfig.bucketName,
        fileName,
        file.data
      );

      return fileEntity;
    });
  }

  // 上传单据时，把单据id注入进去
  async setPKValue(id: string, pkValue: string, pkName: string) {
    const entity = await this.getById(id);
    if (!entity) return;
    entity.pkValue = pkValue;
    entity.pkName = pkName;
    await this.fileModel.save(entity);
    return entity;
  }

  // 清理脏数据，清理前一天的数据
  async clearEmptyPKValueFiles() {
    const curDate = new Date();
    curDate.setDate(curDate.getDate() - 1);

    const records = await this.fileModel
      .createQueryBuilder()
      .where('createDate < :date', { date: curDate })
      .andWhere('pkValue is null')
      .getMany();

    await this.defaultDataSource.transaction(async manager => {
      await manager.remove(FileEntity, records);
      await Promise.all(
        records.map(record =>
          this.minioClient.removeObject(
            this.minioConfig.bucketName,
            record.fileName
          )
        )
      );
    });
  }
}
