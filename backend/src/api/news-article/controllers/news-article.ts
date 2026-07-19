/**
 * news-article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::news-article.news-article', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);

    const user = ctx.state.user;
    if (user && response?.data?.documentId) {
      try {
        const userDocId = user.documentId ?? String(user.id);
        await strapi.documents('api::news-article.news-article').update({
          documentId: response.data.documentId,
          status: 'published',
          data: {
            users_permissions_users: {
              connect: [userDocId],
            },
          } as any,
        });
      } catch (err) {
        console.error('[news-article] Error connecting user:', err);
      }
    }

    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id: documentId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const entity = await strapi.documents('api::news-article.news-article').findOne({
      documentId,
      populate: ['users_permissions_users'],
    });

    if (!entity) {
      return ctx.notFound('News article not found');
    }

    const authors = (entity.users_permissions_users as any) ?? [];
    const authorList = Array.isArray(authors) ? authors : authors?.data ?? [];
    const isAuthor = authorList.some((a: any) => (a.id ?? a.data?.id) === user.id);

    if (!isAuthor) {
      return ctx.forbidden('You can only edit articles you authored');
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id: documentId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const entity = await strapi.documents('api::news-article.news-article').findOne({
      documentId,
      populate: ['users_permissions_users'],
    });

    if (!entity) {
      return ctx.notFound('News article not found');
    }

    const authors = (entity.users_permissions_users as any) ?? [];
    const authorList = Array.isArray(authors) ? authors : authors?.data ?? [];
    const isAuthor = authorList.some((a: any) => (a.id ?? a.data?.id) === user.id);

    if (!isAuthor) {
      return ctx.forbidden('You can only delete articles you authored');
    }

    return super.delete(ctx);
  },
}));
