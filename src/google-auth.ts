import express = require('express');

import {PluginComponent, Pod} from '@amagaki/amagaki';

import {GoogleAuth} from 'google-auth-library';
import {google} from 'googleapis';

// TODO: Include scopes in options.
const SCOPES = ['email', 'profile', 'https://www.googleapis.com/auth/kintaro'];

export interface GoogleAuthPluginOptions {
  keyFile?: string;
}

export class GoogleAuthPlugin implements PluginComponent {
  private pod: Pod;
  authClient: GoogleAuth;

  constructor(pod: Pod, options: GoogleAuthPluginOptions) {
    this.pod = pod;
    // Used with service accounts (either keyFile or auto-configured).
    this.authClient = new google.auth.GoogleAuth({
      scopes: SCOPES,
      keyFile: options.keyFile,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createServerHook(app: express.Express) {
    // TODO: Support user authentication flows.
  }
}

export const register = (pod: Pod, options: GoogleAuthPluginOptions) => {
  // `pod.plugins.register` makes the plugin accessible via
  // `pod.plugins.get('GoogleAuthPlugin')`.
  pod.plugins.register(GoogleAuthPlugin, options as Record<string, any>);
  return pod.plugins.get('GoogleAuthPlugin') as GoogleAuthPlugin;
};
