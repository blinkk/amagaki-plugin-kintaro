import {Common} from 'googleapis';

// NOTE: Generated from `kintaro-content-v1-rest.json`.
export interface KintaroApiClient extends Readonly<Common.Endpoint> {
  collections: {
    createCollection: Function;
    deleteCollection: Function;
    getCollection: Function;
    getCollectionUsage: Function;
    listCollections: Function;
    updateCollection: Function;
  };
  diff: {
    diffCollection: Function;
    diffCollectionPreMerge: Function;
    diffDocuments: Function;
    recordCUJState: Function;
    recordDiffLatency: Function;
  };
  documents: {
    copyDocument: Function;
    copyDocumentLocaleContent: Function;
    createDocument: Function;
    deleteDocument: Function;
    editDocument: Function;
    editField: Function;
    getDocument: Function;
    getDocumentByParams: Function;
    getDocumentVersion: Function;
    getFieldsByDescriptor: Function;
    listDocumentHeaders: Function;
    listDocumentSummaries: Function;
    listDocumentVersions: Function;
    listDocuments: Function;
    multiDocumentCreate: Function;
    multiDocumentUpdate: Function;
    multiTranslationReadinessUpdate: Function;
    revertDocument: Function;
    rpcDocumentGet: Function;
    searchBranch: Function;
    searchDocuments: Function;
    updateDocument: Function;
  };
  firebase: {
    getCustomToken: Function;
  };
  id_name_converter: {
    idNameConverter: Function;
  };
  locale: {
    getLocaleInfo: Function;
  };
  merge: {
    applyProjectMerges: Function;
    findDocumentMerges: Function;
    findMultiDocumentMerges: Function;
    findProjectMerges: Function;
    recordMergeLatency: Function;
  };
  permissions: {
    checkPermissionCurrentUser: Function;
    deletePermissions: Function;
    listPermission: Function;
    setPermissions: Function;
    updatePermissionsSingleObject: Function;
  };
  projects: {
    archiveProject: Function;
    createProject: Function;
    getCollectionInfo: Function;
    getCollections: Function;
    getOutOfSyncCollections: Function;
    getOutOfSyncHeaders: Function;
    getProject: Function;
    listDocumentHeaders: Function;
    listHeaders: Function;
    listProjects: Function;
    projectHistory: Function;
    projectReset: Function;
    rpcGetProject: Function;
    scheduleReindex: Function;
    unArchiveProject: Function;
    updateProject: Function;
  };
  publish: {
    history: Function;
    nukeCollection: Function;
    nukeDocument: Function;
    nukeMultiDocument: Function;
    preview: Function;
    publish: Function;
    rollback: Function;
    status: Function;
  };
  push: {
    approvePush: Function;
    cancelPush: Function;
    chewtoyDryRun: Function;
    fetchPushInfo: Function;
    getPreview: Function;
    getPush: Function;
    previewPush: Function;
    pushList: Function;
    startPush: Function;
    unApprovePush: Function;
    validateApprovers: Function;
  };
  reference_hash: {
    updateReferenceHashes: Function;
  };
  repos: {
    archiveRepo: Function;
    createRepo: Function;
    getRepo: Function;
    getState: Function;
    listRepoHeaders: Function;
    listRepos: Function;
    recordRepoView: Function;
    unArchiveRepo: Function;
    updateRepo: Function;
  };
  resource: {
    resourceCreate: Function;
    resourceGet: Function;
  };
  schemas: {
    createSchema: Function;
    deleteSchema: Function;
    getSchema: Function;
    getSchemaStats: Function;
    listSchemas: Function;
    updateSchema: Function;
  };
  sheltieconfig: {
    createSheltieConfig: Function;
    getSheltieConfig: Function;
    updateSheltieConfig: Function;
  };
  support_tools_services: {
    allowServiceAccount: Function;
    baselineGitRepoAuditFailures: Function;
    examineNestedMetadata: Function;
    fixNestedMetadata: Function;
    legacyUIViewer: Function;
    listBackups: Function;
    removeServiceAccount: Function;
    unlockQueueEntry: Function;
    validateBracketFailure: Function;
  };
  sync: {
    syncCollectionRef: Function;
  };
  translations: {
    addToGttAcl: Function;
    createTranslationRequest: Function;
    getLazarusProductDetails: Function;
    getLazarusProducts: Function;
    getTranslationRequest: Function;
    listTranslationRequests: Function;
    scopedReimport: Function;
    updateTranslationRequest: Function;
  };
}
