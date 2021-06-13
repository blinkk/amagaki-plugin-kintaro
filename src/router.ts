import {
  Environment,
  Pod,
  Route,
  RouteProvider,
  Router,
  Url,
  interpolate,
} from '@amagaki/amagaki';
import {KintaroApiClient, KintaroDocument} from './kintaro';

import {resolveDepth} from './utils';

export interface KintaroRouteProviderOptions {
  collectionId: string;
  depth?: number;
  path: string;
  projectId?: string;
  repoId: string;
  view?: string;
}

interface KintaroRouteOptions {
  document: KintaroDocument;
  pathFormat: string;
  view?: string;
}

interface KintaroTemplateContext {
  doc: KintaroRouteDocument;
  env: Environment;
  pod: Pod;
  process: NodeJS.Process;
}

export class KintaroRouteProvider extends RouteProvider {
  options: KintaroRouteProviderOptions;
  client: KintaroApiClient;

  constructor(
    router: Router,
    client: KintaroApiClient,
    options: KintaroRouteProviderOptions
  ) {
    super(router);
    this.type = 'kintaro';
    this.options = options;
    this.client = client;
  }

  async routes(): Promise<KintaroRoute[]> {
    const resp = await this.client.documents.listDocumentSummaries({
      repo_id: this.options.repoId,
      project_id: this.options.projectId,
      collection_id: this.options.collectionId,
      return_json: true,
    });
    const promises = [];
    for (const summaryDocument of resp.data.documents) {
      promises.push(
        this.client.documents.getDocument({
          collection_id: this.options.collectionId,
          depth: this.options.depth || 4,
          document_id: summaryDocument.document_id,
          project_id: this.options.projectId,
          repo_id: this.options.repoId,
          use_json: true,
        })
      );
    }
    const results = await Promise.all(promises);
    return results.map(result => {
      return new KintaroRoute(this, {
        document: result.data as KintaroDocument,
        pathFormat: this.options.path,
        view: this.options.view,
      });
    });
  }
}

class KintaroRoute extends Route {
  options: KintaroRouteOptions;
  routeDoc: KintaroRouteDocument;

  // TODO: Pull this from the pod's default route.
  static DEFAULT_VIEW = '/views/base.njk';

  constructor(provider: RouteProvider, options: KintaroRouteOptions) {
    super(provider);
    this.provider = provider;
    this.options = options;
    this.routeDoc = new KintaroRouteDocument(this.provider.pod, {
      document: options.document,
      pathFormat: options.pathFormat,
      view: options.view,
    });
  }
  get contentType() {
    return 'text/html';
  }
  get path() {
    return this.urlPath;
  }
  get urlPath() {
    return this.routeDoc.urlPath;
  }
  async build() {
    try {
      return await this.routeDoc.render({
        route: this,
      });
    } catch (err) {
      console.error(`Error buildng: ${this.routeDoc}`);
      throw err;
    }
  }
}

class KintaroRouteDocument {
  pod: Pod;
  document: KintaroDocument;
  private _pathFormat: string;
  private _view?: string;
  private _fields?: Record<string, any>;

  constructor(pod: Pod, options: KintaroRouteOptions) {
    this.pod = pod;
    this.document = options.document;
    this._pathFormat = options.pathFormat;
    this._view = options.view;
  }

  get fields() {
    if (this._fields) {
      return this._fields;
    }
    this._fields = this.document.content_json
      ? JSON.parse(this.document.content_json)
      : {};
    this._fields = resolveDepth(this._fields);
    return this._fields;
  }

  get basename() {
    return this.document.document_id;
  }

  get pathFormat() {
    return this._pathFormat;
  }

  get view() {
    return this.fields?.['$view'] || this._view || KintaroRoute.DEFAULT_VIEW;
  }

  get urlPath() {
    // TODO: Replace with eventual shared utility for cleaning URLs within Amagaki.
    let urlPath = interpolate(this.pod, this.pathFormat, {
      doc: this,
      pod: this.pod,
    }) as string;
    urlPath = urlPath.replace(/\/{2,}/g, '/');
    urlPath = urlPath.replace(/index\/?$/, '');
    return urlPath;
  }

  get url() {
    return new Url({
      path: this.urlPath,
      env: this.pod.env,
    });
  }

  async render(context?: Record<string, any>): Promise<string> {
    const defaultContext: KintaroTemplateContext = {
      doc: this,
      env: this.pod.env,
      pod: this.pod,
      process: process,
    };
    if (context) {
      Object.assign(defaultContext, context);
    }
    const templateEngine = this.pod.engines.getEngineByFilename(this.view);
    return templateEngine.render(this.view, defaultContext);
  }
}
