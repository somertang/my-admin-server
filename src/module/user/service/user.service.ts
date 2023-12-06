import { ILogger, Inject, Provide } from '@midwayjs/core';
import { UserEntity } from '../entity/user.entity';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
// import { omit } from 'lodash';
import { InjectDataSource, InjectEntityModel } from '@midwayjs/typeorm';
import { BaseService } from '@/common/base.service';
import { R } from '@/common/base.error';
import { omit } from 'lodash';
import { UserVO } from '@/module/user/vo/user.vo';
import { FileEntity } from '@/module/file/entity/file.entity';

@Provide()
export class UserService extends BaseService<UserEntity> {
  @InjectEntityModel(UserEntity)
  userModal: Repository<UserEntity>;

  @InjectEntityModel(FileEntity)
  fileModal: Repository<FileEntity>;

  @InjectDataSource()
  defaultDataSource: DataSource;

  @Inject()
  logger: ILogger;

  getModel(): Repository<UserEntity> {
    return this.userModal;
  }

  /**
   * 创建用户
   * @param entity
   */
  async createUser(entity: UserEntity) {
    const { userName, userEmail, userMobile } = entity;
    let isExist = (await this.userModal.countBy({ userName })) > 0;
    if (isExist) {
      throw R.error('当前用户名已存在');
    }
    isExist = (await this.userModal.countBy({ userMobile })) > 0;
    if (isExist) {
      throw R.error('当前手机号码已存在');
    }
    isExist = (await this.userModal.countBy({ userEmail })) > 0;
    if (isExist) {
      throw R.error('当前邮箱地址已存在');
    }
    // 添加用户的默认密码是123456，对密码进行加盐加密
    entity.userPassword = bcrypt.hashSync('123456', 10);

    await this.defaultDataSource.transaction(async entityManager => {
      await entityManager.save(UserEntity, entity);

      if (entity.userAvatar) {
        await entityManager
          .createQueryBuilder()
          .update(FileEntity)
          .set({
            pkValue: entity.id,
            pkName: 'my_user&user_avatar',
          })
          .where('id = :id', { id: entity.userAvatar })
          .execute();
      }
    });

    await this.userModal.save(entity);

    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  async editUser(entity: UserEntity): Promise<UserVO> {
    const { userName, userEmail, userMobile, id } = entity;
    let user = await this.userModal.findOneBy({ userName });
    if (user && user.id !== id) {
      throw R.error('当前用户名已存在');
    }
    user = await this.userModal.findOneBy({ userMobile });
    if (user && user.id !== id) {
      throw R.error('当前手机号码已存在');
    }
    user = await this.userModal.findOneBy({ userEmail });
    if (user && user.id !== id) {
      throw R.error('当前邮箱地址已存在');
    }

    const fileRecord = await this.fileModal.findOneBy({
      pkValue: entity.userAvatar,
      pkName: 'my_user&user_avatar',
    });

    this.defaultDataSource.transaction(async entityManager => {
      if (fileRecord && !entity.userAvatar) {
        await this.fileModal.remove(fileRecord);
      } else if (
        fileRecord &&
        entity.userAvatar &&
        fileRecord.id !== entity.userAvatar
      ) {
        await Promise.all([
          entityManager.delete(FileEntity, fileRecord.id),
          entityManager
            .createQueryBuilder()
            .update(FileEntity)
            .set({
              pkValue: fileRecord.id,
              pkName: 'my_user&user_avatar',
            })
            .where('id = :id', { id: entity.userAvatar })
            .execute(),
        ]);
      } else if (!fileRecord && entity.userAvatar) {
        await entityManager
          .createQueryBuilder()
          .update(FileEntity)
          .set({
            pkValue: fileRecord.id,
            pkName: 'my_user&user_avatar',
          })
          .where('id = :id', { id: entity.userAvatar })
          .execute();
      }
    });

    await this.userModal.save(entity);
    // 把entity中的password移除返回给前端
    return omit(entity, ['userPassword']) as UserVO;
  }

  async pageUser<T>(page = 0, pageSize = 10, where?: FindOptionsWhere<T>) {
    this.logger.info(
      this.userModal
        .createQueryBuilder('t')
        .leftJoinAndMapOne(
          't.avatarEntity',
          FileEntity,
          'file',
          'file.pkValue = t.id and file.pkName = "my_user&user_avatar"'
        )
        .where(where)
        .skip(page * pageSize)
        .take(pageSize)
        .orderBy('t.created_date', 'DESC')
        .getSql()
    );

    const [data, total] = await this.userModal
      .createQueryBuilder('t')
      .leftJoinAndMapOne(
        't.avatarEntity',
        FileEntity,
        'file',
        'file.pkValue = t.id and file.pkName = "my_user&user_avatar"'
      )
      .where(where)
      .skip(page * pageSize)
      // .take(pageSize)
      .orderBy('t.created_date', 'DESC')
      .getManyAndCount();

    this.logger.info(total);

    return {
      data: data.map(item => item.toVO()),
      total,
    };
  }
}
