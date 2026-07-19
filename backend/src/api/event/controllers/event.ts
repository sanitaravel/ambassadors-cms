/**
 * event controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::event.event', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);

    const user = ctx.state.user;
    if (user && response?.data?.documentId) {
      try {
        const userDocId = user.documentId ?? String(user.id);
        await strapi.documents('api::event.event').update({
          documentId: response.data.documentId,
          status: 'published',
          data: {
            creator: userDocId,
          } as any,
        });
      } catch (err) {
        console.error('[event] Error connecting user:', err);
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

    const entity = await strapi.documents('api::event.event').findOne({
      documentId,
      populate: ['creator'],
    });

    if (!entity) {
      return ctx.notFound('Event not found');
    }

    const creator = entity.creator as any;
    const creatorId = creator?.id ?? creator?.data?.id;
    if (creatorId !== user.id) {
      return ctx.forbidden('You can only edit your own events');
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id: documentId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const entity = await strapi.documents('api::event.event').findOne({
      documentId,
      populate: ['creator'],
    });

    if (!entity) {
      return ctx.notFound('Event not found');
    }

    const creator = entity.creator as any;
    const creatorId = creator?.id ?? creator?.data?.id;
    if (creatorId !== user.id) {
      return ctx.forbidden('You can only delete your own events');
    }

    return super.delete(ctx);
  },
}));
