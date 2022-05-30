import KwilDBTable from './kwildbTable';
import { KwilDBConnectorConfig } from './models';

const KwilDB = require('kwildb');

class KwilDBBuilder {
  private connections: Map<string, any> = new Map();
  private currentConnection = 'default';
  private secretKey: string;
  private sync = false;

  constructor(secretKey: string, sync = false) {
    this.secretKey = secretKey;
    this.sync = sync;
  }

  // --------------------- connections

  connect(config: KwilDBConnectorConfig, connectionName = 'default') {
    const host = config.host || 'test-db.kwil.xyz';
    const protocol = config.protocol || 'https';
    const moat = config.moat;
    const privateKey = config.privateKey;

    const connection = KwilDB.createConnector({ host, protocol, moat, privateKey }, this.secretKey);
    this.connections.set(connectionName, connection);
  }

  setCurrentConnection(connection: string) {
    if (! this.connections.has(connection)) {
      return;
    }

    this.currentConnection = this.currentConnection;
    return this;
  }

  getConnection(connectionName = this.currentConnection) {
    const connection = this.connections.get(connectionName);
    if (! connection) {
      throw new Error(`Could not find connection "${this.currentConnection}"`);
    }

    return connection;
  }

  // --- table

  table(tableName: string) {
    const connection = this.getConnection();

    return new KwilDBTable(connection, tableName, this.sync);
  }

  // -- helpers

  // with connection

  async getMoatFunding() {
    const connection = this.getConnection();
    const { funding } = await connection.getMoatFunding();
    return funding;
  }

  async getMoatDebit() {
    const connection = this.getConnection();
    const { debit } = await connection.getMoatDebit();
    return debit;
  }

  async createSchema(name: string) {
    const connection = this.getConnection();

    const result = await connection.preparedStatement(`CREATE SCHEMA ${name}`, this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async dropSchema(name: string) {
    const connection = this.getConnection();

    const result = await connection.preparedStatement(`DROP SCHEMA ${name}`, this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }
}

export default KwilDBBuilder;
