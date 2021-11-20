const dotenv = require('dotenv');
dotenv.config();
import express, { Response, Request } from 'express';
const cors = require('cors');
var bodyParser = require('body-parser');
const app = express();
const graphqlHTTP = require('express-graphql').graphqlHTTP;
const expressPlayground = require('graphql-playground-middleware-express').default;
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { join } from 'path';
const stripe = require('stripe')(process.env.STRIPE_KEY);

// GraphQL schema
import {schema} from './graphql';

app.use(cors());

const fs = require('fs');
const graphql = require('graphql');
const schemaPath = '../frontend/schema.graphql';
const schemaString = graphql.printSchema(schema);
let oldSchemaString;
try {
  oldSchemaString = fs.readFileSync(schemaPath);
} catch (e) {}

if(schemaString !== oldSchemaString){
  fs.writeFileSync(
    schemaPath,
    schemaString
  );
  console.log('schema updated!');
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// a great gql playground
app.get('/gql', expressPlayground({ endpoint: '/graphql' }));

// GraphQL endpoint
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
    pretty: true
  })
);

// Home endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('<h1>API is up and up only!</h1>');
});

app.post('/create-checkout-session', async (req, res) => {
  const { priceId, customer_email } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email,
      // discounts: [{
      //   coupon: 'blZNMw34',
      // }],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: process.env.APP + '/redirects/stripe?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.APP,
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e: any) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App is up, and up only at ${PORT}`));