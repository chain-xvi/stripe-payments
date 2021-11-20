import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './app.scss';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import {
	Home,
	Redirects,
} from './pages';

import {
	Relay,
} from './data/relay';

// this is where you could have different layers of your app, navbars,
// sidebars, builders, out-of-dashboard pages, middlewares...
export function Container(){
	return (
		<div className="container">
			<Suspense fallback={"loading..."}>
				<Relay>
					<Router>
		        <Switch>
		          <Route path="/redirects/:source" component={Redirects} />
		          <Route path="/" component={Home} />
		        </Switch>
			    </Router>
				</Relay>
			</Suspense>
			<Toaster />
		</div>
	)
}