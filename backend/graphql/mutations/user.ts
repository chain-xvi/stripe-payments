import { toGlobalId } from 'graphql-relay';
import { GraphQLNonNull } from 'graphql';
import { UserType } from '../types/user';
import { knex } from '../../db';
const stripe = require('stripe')(process.env.STRIPE_KEY);

import {
	GraphQLString,
} from 'graphql';

export const createUser = {
	type: new GraphQLNonNull(UserType),
	args: {
		name: { type: GraphQLString },
	},
	async resolve(_: any, args: any) {
		const {name} = args;
		const data = await knex('users').returning('id').insert({name});
		return {
			id: data[0],
			name,
		}
	}
}

export const updatePlan = {
	type: new GraphQLNonNull(UserType),
	args: {
		id: { type: GraphQLString },
	},
	async resolve(_: any, args: any) {
		const {id} = args;
		if(!id) {
      throw new Error(`Plan not found`);
    }

    // this would be coming from the jwt token. Now it's just for testing
		const user = (await knex.select().from('users').where({ id: 1 }))[0];

		const session = await stripe.checkout.sessions.retrieve(id);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const product = await stripe.products.retrieve(subscription.plan.product);
    const active_plan = product.name.split(' ')[0].toLowerCase();

    const data = await knex('users')
    .where({ id: user.id })
    .update({
      active_plan,
      customer_id: subscription.customer,
      session_id: id,
    })
    .returning(['id']);

    return {
      id: user.id,
      active_plan,
      session_id: id,
    }
	}
}

export const changePlan = {
	type: new GraphQLNonNull(UserType),
	args: {
		price: { type: GraphQLString },
		plan: { type: GraphQLString },
	},
	async resolve(_: any, args: any) {
		const {price, plan} = args;
		if(!price) {
      throw new Error(`Price not found`);
    }
		if(!plan) {
      throw new Error(`Plan not found`);
    }

    // this would be coming from the jwt token. Now it's just for testing
		const user = (await knex.select().from('users').where({ id: 1 }))[0];

		const session = await stripe.checkout.sessions.retrieve(user.session_id);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    await stripe.subscriptions.update(session.subscription, {
		  cancel_at_period_end: false,
		  proration_behavior: 'create_prorations',
		  items: [{
		    id: subscription.items.data[0].id,
		    price,
		  }]
		});

    const _price = await stripe.prices.retrieve(price);
		const product = await stripe.products.retrieve(_price.product);
    const active_plan = product.name.split(' ')[0].toLowerCase();

    const data = await knex('users')
    .where({ id: user.id })
    .update({
      active_plan,
    })
    .returning(['id']);

    return {
      id: user.id,
      active_plan,
    }
	}
}