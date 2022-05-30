import KwilDBTable from './kwildbTable';
import { KeyValueString, KwilDBConnectorConfig } from './models';

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

  setSync(sync: boolean) {
    this.sync = sync;
  }

  isSyncing() {
    return this.sync;
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

    const result = await connection.preparedStatement(`CREATE SCHEMA ${name}`, [], this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async dropSchema(name: string) {
    const connection = this.getConnection();

    const result = await connection.preparedStatement(`DROP SCHEMA ${name}`, [], this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async createTable(name: string, columns: KeyValueString, constraints: string[] = []) {
    const connection = this.getConnection();

    const columnsSql = [];
    for (let [column, type] of Object.entries(columns)) {
      const columnSql = `${column} ${type}`;
      columnsSql.push(columnSql);
    }

    let sqlStatement = `CREATE TABLE ${name} (
      ${columnsSql.join(',')}${constraints.length > 0 ? ',' : ''}
      ${constraints.join(',')}
    )`;

    const result = await connection.preparedStatement(sqlStatement, [], this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async dropTable(name: string) {
    const connection = this.getConnection();

    const sqlStatement = `DROP TABLE ${name}`;

    const result = await connection.preparedStatement(sqlStatement, [], this.sync);

    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async rawQuery(query: string) {
    const connection = this.getConnection();

    const result = await connection.query(query, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result;
  }

  async rawPreparedStatement(query: string, values: string[] = []) {
    const connection = this.getConnection();

    const result = await connection.preparedStatement(query, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result;
  }
}

export default KwilDBBuilder;
