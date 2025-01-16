import { UnauthorizedUserError, User, adspId } from '@abgov/adsp-service-sdk';
import { TopicEntity } from './topic';
import { TopicTypeEntity } from './type';
import { ServiceRoles } from '../roles';
import { Comment } from '../types';

describe('TopicEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const type = new TopicTypeEntity(tenantId, {
    id: 'test',
    name: 'Test',
    adminRoles: ['test-admin'],
    commenterRoles: ['test-commenter'],
    readerRoles: ['test-reader'],
  });

  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    saveComment: jest.fn(),
    delete: jest.fn(() => Promise.resolve(true)),
    deleteComment: jest.fn(),
  };

  const user = { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.TopicSetter] };

  beforeEach(() => {
    repositoryMock.save.mockClear();
    repositoryMock.delete.mockClear();
    repositoryMock.getComment.mockReset();
    repositoryMock.getComments.mockReset();
    repositoryMock.deleteComment.mockReset();
    repositoryMock.saveComment.mockReset();
  });

  it('can be initialized', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    expect(entity).toBeTruthy();
  });

  describe('create', () => {
    it('can create new topic', async () => {
      const result = await TopicEntity.create(user as User, repositoryMock, type, {
        tenantId: null,
        name: 'test',
        description: 'This is a test topic.',
      });

      expect(result).toBeTruthy();
      expect(repositoryMock.save).toHaveBeenCalledWith(result);
    });

    it('can fail for user without role', () => {
      expect(() => {
        TopicEntity.create({ ...user, roles: [] } as User, repositoryMock, type, {
          tenantId: null,
          name: 'test',
          description: 'This is a test topic.',
        });
      }).toThrowError(UnauthorizedUserError);
    });
  });

  describe('update', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });

    it('can update topic', async () => {
      const update = { name: 'new name', description: 'new description', commenters: ['user-abc'] };
      const result = await entity.update(user as User, update);

      expect(result).toMatchObject(update);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can fail for user without role', () => {
      expect(() => {
        const update = { name: 'new name', description: 'new description' };
        entity.update({ ...user, roles: [] } as User, update);
      }).toThrowError(UnauthorizedUserError);
    });
  });

  describe('delete', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });

    it('can delete topic', async () => {
      const result = await entity.delete(user as User);

      expect(result).toBe(true);
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity);
    });

    it('can fail for user without role', () => {
      expect(() => {
        entity.delete({ ...user, roles: [] } as User);
      }).toThrowError(UnauthorizedUserError);
    });
  });

  describe('canRead', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can return true for user with reader role', () => {
      const result = entity.canRead({ ...user, roles: ['test-reader'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without role', () => {
      const result = entity.canRead({ ...user, roles: [] } as User);
      expect(result).toBe(false);
    });
  });

  describe('canComment', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can return true for user with commenter role', () => {
      const result = entity.canComment({ ...user, roles: ['test-commenter'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without role', () => {
      const result = entity.canComment({ ...user, roles: [] } as User);
      expect(result).toBe(false);
    });
  });

  describe('canModifyComment', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can return true for original commenter with commenter role', () => {
      const result = entity.canModifyComment(
        { ...user, roles: ['test-commenter'] } as User,
        {
          createdBy: user,
          id: 1,
          title: 'test',
          content: 'testing',
        } as unknown as Comment
      );
      expect(result).toBe(true);
    });

    it('can return false for other user with commenter role', () => {
      const result = entity.canModifyComment(
        { ...user, roles: ['test-commenter'] } as User,
        {
          createdBy: { id: 'another' },
          id: 1,
          title: 'test',
          content: 'testing',
        } as unknown as Comment
      );
      expect(result).toBe(false);
    });

    it('can return true for user with admin role', () => {
      const result = entity.canModifyComment(
        { ...user, roles: ['test-admin'] } as User,
        {
          createdBy: { id: 'another' },
          id: 1,
          title: 'test',
          content: 'testing',
        } as unknown as Comment
      );
      expect(result).toBe(true);
    });
  });

  describe('getComments', () => {
    const entity = new TopicEntity(repositoryMock, type, {
      tenantId,
      id: 1,
      name: 'Test',
      description: 'test',
      commenters: ['commenter'],
    });
    it('can return comments for user with reader role', async () => {
      const comments = { results: [], page: {} };
      repositoryMock.getComments.mockResolvedValueOnce(comments);

      const criteria = {};
      const result = await entity.getComments({ ...user, roles: ['test-reader'] } as User, 10, null, criteria);
      expect(result).toEqual(expect.objectContaining(comments));
      expect(repositoryMock.getComments).toHaveBeenCalledWith(
        10,
        null,
        expect.objectContaining({ topicIdEquals: entity.id, tenantIdEquals: entity.tenantId })
      );
    });

    it('can fail for user without role', async () => {
      await expect(entity.getComments({ ...user, roles: [] } as User, 10)).rejects.toThrow(UnauthorizedUserError);
    });

    it('can return anonymized comments for commenter', async () => {
      const commentA = {
        id: 123,
        content: 'test',
        createdBy: {
          id: 'commenter',
          name: 'Commenter',
        },
        lastUpdatedBy: {
          id: 'commenter',
          name: 'Commenter',
        },
      };
      const commentB = {
        id: 124,
        content: 'test',
        createdBy: {
          id: user.id,
          name: user.name,
        },
        lastUpdatedBy: {
          id: user.id,
          name: user.name,
        },
      };
      const comments = { results: [commentA, commentB], page: {} };
      repositoryMock.getComments.mockResolvedValueOnce(comments);

      const criteria = {};
      const result = await entity.getComments({ ...user, id: 'commenter' } as User, 10, null, criteria);
      expect(result).toEqual(
        expect.objectContaining({
          ...comments,
          results: expect.arrayContaining([
            expect.objectContaining(commentA),
            expect.objectContaining({
              ...commentB,
              createdBy: expect.objectContaining({ id: user.id, name: null }),
              lastUpdatedBy: expect.objectContaining({ id: user.id, name: null }),
            }),
          ]),
        })
      );
      expect(repositoryMock.getComments).toHaveBeenCalledWith(
        10,
        null,
        expect.objectContaining({ topicIdEquals: entity.id, tenantIdEquals: entity.tenantId })
      );
    });
  });

  describe('getComment', () => {
    const entity = new TopicEntity(repositoryMock, type, {
      tenantId,
      id: 1,
      name: 'Test',
      description: 'test',
      commenters: ['commenter'],
    });
    it('can return comment for user with reader role', async () => {
      const comment = {
        id: 123,
        content: 'test',
        createdBy: {
          id: user.id,
          name: user.name,
        },
        lastUpdatedBy: {
          id: user.id,
          name: user.name,
        },
      };
      repositoryMock.getComment.mockResolvedValueOnce(comment);

      const result = await entity.getComment({ ...user, roles: ['test-reader'] } as User, 1);
      expect(result).toEqual(expect.objectContaining(comment));
      expect(repositoryMock.getComment).toHaveBeenCalledWith(entity, 1);
    });

    it('can fail for user without role', async () => {
      await expect(entity.getComment({ ...user, roles: [] } as User, 1)).rejects.toThrow(UnauthorizedUserError);
    });

    it('can return anonymized comment for commenter', async () => {
      const comment = {
        id: 123,
        content: 'test',
        createdBy: {
          id: 'commenter',
          name: 'Commenter',
        },
        lastUpdatedBy: {
          id: user.id,
          name: user.name,
        },
      };
      repositoryMock.getComment.mockResolvedValueOnce(comment);

      const result = await entity.getComment({ ...user, id: 'commenter' } as User, 1);
      expect(result).toEqual(
        expect.objectContaining({
          ...comment,
          lastUpdatedBy: expect.objectContaining({ id: user.id, name: null }),
        })
      );
      expect(repositoryMock.getComment).toHaveBeenCalledWith(entity, 1);
    });
  });

  describe('postComment', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can create comment for user with commenter role', async () => {
      const comment = {
        title: 'test',
        content: 'testing',
      };
      repositoryMock.saveComment.mockResolvedValueOnce(comment);

      const commenter = { ...user, roles: ['test-commenter'] } as User;
      const result = await entity.postComment(commenter, comment as Comment);
      expect(result).toBe(comment);
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        entity,
        expect.objectContaining({
          ...comment,
          id: undefined,
          createdBy: commenter,
          createdOn: expect.any(Date),
          lastUpdatedBy: commenter,
          lastUpdatedOn: expect.any(Date),
        })
      );
    });

    it('can fail for user without role', async () => {
      await expect(entity.postComment({ ...user, roles: [] } as User, {} as Comment)).rejects.toThrow(
        UnauthorizedUserError
      );
    });

    it('can create comment and flag requires attention', async () => {
      const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
      const comment = {
        title: 'test',
        content: 'testing',
      };
      repositoryMock.saveComment.mockResolvedValueOnce(comment);
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const commenter = { ...user, roles: ['test-commenter'] } as User;
      const result = await entity.postComment(commenter, comment as Comment, true);
      expect(result).toBe(comment);
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        entity,
        expect.objectContaining({
          ...comment,
          id: undefined,
          createdBy: commenter,
          createdOn: expect.any(Date),
          lastUpdatedBy: commenter,
          lastUpdatedOn: expect.any(Date),
        })
      );
      expect(entity.requiresAttention).toBe(true);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can create comment and clear requires attention', async () => {
      const entity = new TopicEntity(repositoryMock, type, {
        tenantId,
        id: 1,
        name: 'Test',
        description: 'test',
        requiresAttention: true,
      });
      const comment = {
        title: 'test',
        content: 'testing',
      };
      repositoryMock.saveComment.mockResolvedValueOnce(comment);
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const commenter = { ...user, roles: ['test-commenter'] } as User;
      const result = await entity.postComment(commenter, comment as Comment, false);
      expect(result).toBe(comment);
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        entity,
        expect.objectContaining({
          ...comment,
          id: undefined,
          createdBy: commenter,
          createdOn: expect.any(Date),
          lastUpdatedBy: commenter,
          lastUpdatedOn: expect.any(Date),
        })
      );
      expect(entity.requiresAttention).toBe(false);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can skip requires attention update when not changed', async () => {
      const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
      const comment = {
        title: 'test',
        content: 'testing',
      };
      repositoryMock.saveComment.mockResolvedValueOnce(comment);

      const commenter = { ...user, roles: ['test-commenter'] } as User;
      const result = await entity.postComment(commenter, comment as Comment, false);
      expect(result).toBe(comment);
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        entity,
        expect.objectContaining({
          ...comment,
          id: undefined,
          createdBy: commenter,
          createdOn: expect.any(Date),
          lastUpdatedBy: commenter,
          lastUpdatedOn: expect.any(Date),
        })
      );
      expect(entity.requiresAttention).toBe(false);
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can update comment for user with commenter', async () => {
      const comment = {
        id: 1,
        title: 'test',
        content: 'testing',
        createdBy: {
          id: user.id,
        },
      };
      repositoryMock.saveComment.mockResolvedValueOnce(comment);

      const update = {
        title: 'new title',
        content: 'new content',
      };

      const commenter = { ...user, roles: ['test-commenter'] } as User;
      const result = await entity.updateComment(commenter, comment as Comment, update);
      expect(result).toBe(comment);
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        entity,
        expect.objectContaining({
          ...update,
          id: 1,
          lastUpdatedBy: commenter,
          lastUpdatedOn: expect.any(Date),
        })
      );
    });

    it('can fail for user without role', async () => {
      await expect(entity.updateComment({ ...user, roles: [] } as User, {} as Comment, {})).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });

  describe('deleteComment', () => {
    const entity = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });
    it('can delete for user with role', async () => {
      repositoryMock.deleteComment.mockResolvedValueOnce(true);

      const result = await entity.deleteComment({ ...user, roles: ['test-admin'] } as User, { id: 1 } as Comment);
      expect(result).toBe(true);
      expect(repositoryMock.deleteComment).toHaveBeenCalledWith(entity, 1);
    });

    it('can fail for user without role', async () => {
      await expect(entity.deleteComment({ ...user, roles: [] } as User, { id: 1 } as Comment)).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });
});
