/**
 * activity-club controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::activity-club.activity-club', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);

    const user = ctx.state.user;
    if (user && response?.data?.documentId) {
      try {
        const userDocId = user.documentId ?? String(user.id);
        await strapi.documents('api::activity-club.activity-club').update({
          documentId: response.data.documentId,
          status: 'published',
          data: {
            users_permissions_user: userDocId,
          } as any,
        });
      } catch (err) {
        console.error('[activity-club] Error connecting user:', err);
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

    const entity = await strapi.documents('api::activity-club.activity-club').findOne({
      documentId,
      populate: ['users_permissions_user'],
    });

    if (!entity) {
      return ctx.notFound('Activity club not found');
    }

    const owner = entity.users_permissions_user as any;
    const ownerId = owner?.id ?? owner?.data?.id;
    if (ownerId !== user.id) {
      return ctx.forbidden('You can only edit your own clubs');
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id: documentId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const entity = await strapi.documents('api::activity-club.activity-club').findOne({
      documentId,
      populate: ['users_permissions_user'],
    });

    if (!entity) {
      return ctx.notFound('Activity club not found');
    }

    const owner = entity.users_permissions_user as any;
    const ownerId = owner?.id ?? owner?.data?.id;
    if (ownerId !== user.id) {
      return ctx.forbidden('You can only delete your own clubs');
    }

    return super.delete(ctx);
  },
}));
