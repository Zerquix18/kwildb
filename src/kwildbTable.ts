import { Condition, ConditionOperator, KeyValueObject, Order } from "./models";

class KwilDBTable {
  private connection: any;
  private tableName: string;
  private sync: boolean;

  private conditions: Condition[] = [];
  private toSelect: string[] = [];
  private toLimit: number;
  private toOrder: [string, Order];

  constructor(connection: any, tableName: string, sync: boolean) {
    this.connection = connection;
    this.tableName = tableName;
    this.sync = sync;
  }

  async insert(values: KeyValueObject[]) {
    // @todo maybe use the one with the highest amount of keys in case they are inconsistent
    const keys = Object.keys(values[0]);
    const columns = keys.join(',');

    const valuesForPreparedStatement = values.map(item => keys.map(key => item[key]));

    let sqlStatement = `INSERT INTO ${this.tableName} (${columns}) VALUES `;

    valuesForPreparedStatement.forEach((item, index) => {
      const maskedValues = item.map((_, index2) => `$${(item.length * index) + (index2 + 1)}`);
      sqlStatement += `(${maskedValues.join(',')})`;

      const isLastOne = index === valuesForPreparedStatement.length - 1;
      if (! isLastOne) {
        sqlStatement += ',';
      }
    });

    const result = await this.connection.preparedStatement(sqlStatement, valuesForPreparedStatement.flat(), this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    const affectedRows = result.rowCount;

    return { affectedRows };
  }

  async update(values: KeyValueObject) {
    let sqlStatement = `UPDATE ${this.tableName} SET `;
    const keys = Object.keys(values);

    let valuesForPreparedStatement: (string | number | null)[] = [];

    keys.forEach((key, index) => {
      const value = values[key];
      const maskedValue = valuesForPreparedStatement.length + 1;
      sqlStatement += `${key} = $${maskedValue}`;
      valuesForPreparedStatement.push(value);

      if (index !== keys.length - 1) {
        sqlStatement += ',';
      }
    });

    const where = this.getWhereBlock(valuesForPreparedStatement.length);
    sqlStatement += ` ${where.sql}`;
    valuesForPreparedStatement = valuesForPreparedStatement.concat(where.values);

    const result = await this.connection.preparedStatement(sqlStatement, valuesForPreparedStatement, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    const affectedRows = result.rowCount;

    return { affectedRows };
  }

  async delete() {
    const where = this.getWhereBlock();
    const values = where.values;

    let sqlStatement = `DELETE FROM ${this.tableName} ${where.sql}`;
    if (typeof this.toLimit === 'number') {
      sqlStatement += ` LIMIT ${this.toLimit}`;
    }

    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    const affectedRows = result.rowCount;

    return { affectedRows };
  }

  async truncate() {
    const sqlStatement = `TRUNCATE ${this.tableName}`;
    const result = await this.connection.preparedStatement(sqlStatement, [], this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }
  }

  async get() {
    const fields = this.toSelect.length === 0 ? '*' : this.toSelect.join(',');
    const where = this.getWhereBlock();
    let sqlStatement = `SELECT ${fields} FROM ${this.tableName} ${where.sql}`;

    if (this.toOrder) {
      sqlStatement += ` ORDER BY ${this.toOrder[0]} ${this.toOrder[1]}`;
    }

    if (typeof this.toLimit === 'number') {
      sqlStatement += ` LIMIT ${this.toLimit}`;
    }

    const result = await this.connection.preparedStatement(sqlStatement, where.values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result.rows as KeyValueObject[];
  }

  async first() {
    const rows = await this.limit(1).get();
    return rows[0];
  }

  async find(id: string | number) {
    const sqlStatement = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.connection.preparedStatement(sqlStatement, [id], this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result.rows[0];
  }

  async count() {
    const where = this.getWhereBlock();
    const values = where.values;

    const sqlStatement = `SELECT COUNT(*) FROM ${this.tableName} ${where.sql}`;
    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return parseInt(result.rows[0].count);
  }

  async max(field: string) {
    const where = this.getWhereBlock();
    const values = where.values;

    const sqlStatement = `SELECT MAX(${field}) FROM ${this.tableName} ${where.sql}`;
    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return parseFloat(result.rows[0].max);
  }

  async min(field: string) {
    const where = this.getWhereBlock();
    const values = where.values;

    const sqlStatement = `SELECT MIN(${field}) FROM ${this.tableName} ${where.sql}`;
    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return parseFloat(result.rows[0].min);
  }

  async avg(field: string) {
    const where = this.getWhereBlock();
    const values = where.values;

    const sqlStatement = `SELECT AVG(${field}) FROM ${this.tableName} ${where.sql}`;
    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return parseFloat(result.rows[0].avg);
  }

  async sum(field: string) {
    const where = this.getWhereBlock();
    const values = where.values;

    const sqlStatement = `SELECT SUM(${field}) FROM ${this.tableName} ${where.sql}`;
    const result = await this.connection.preparedStatement(sqlStatement, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return parseFloat(result.rows[0].sum);
  }

  async rawQuery(query: string) {
    const result = await this.connection.query(query, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result;
  }

  async rawPreparedStatement(query: string, values: string[] = []) {
    const result = await this.connection.preparedStatement(query, values, this.sync);
    if (typeof result === 'string') {
      throw new Error(result);
    }

    return result;
  }

  ////////// -- QUERY MODIFIERS

  where(field: string, operator: ConditionOperator, value: string | number) {
    this.conditions.push({ field, operator, value });
    return this;
  }

  whereNull(field: string) {
    this.conditions.push({ field, operator: 'null' });
    return this;
  }

  whereNotNull(field: string) {
    this.conditions.push({ field, operator: 'not_null' });
    return this;
  }

  whereIn(field: string, values: (string | number)[]) {
    this.conditions.push({ field, operator: 'in', values });
    return this;
  }

  whereBetween(field: string, values: [number, number]) {
    this.conditions.push({ field, operator: 'between', values });
    return this;
  }

  select(fields: string[]) {
    this.toSelect = fields;
    return this;
  }

  orderBy(field: string, order: Order) {
    this.toOrder = [field, order];
    return this;
  }

  limit(limit: number) {
    this.toLimit = limit;
    return this;
  }

  //////////// HELPER FUNCTIONS

  private getWhereBlock(baseForMaskedValues = 0) {
    if (this.conditions.length === 0) {
      return { sql: '', values: [] };
    }

    let sql = 'WHERE ';
    const values: (string | number)[] = [];

    this.conditions.forEach((condition, index) => {
      const { field, operator } = condition;
      switch (operator) {
        case '<':
        case '>':
        case '=':
          const maskedValue = `$${baseForMaskedValues + values.length + 1}`;
          sql += `${field} ${operator} ${maskedValue}`;
          values.push(condition.value);
          break;
        case 'like':
          sql += `${field} LIKE '${condition.value}'`; // todo: unprotected?
          break;
        case 'null':
        case 'not_null':
          sql += `${field} ${operator === 'null' ? 'IS NULL' : 'IS NOT NULL'}`;
          break;
        case 'between':
          const firstValue = `$${baseForMaskedValues + values.length + 1}`;
          const secondValue = `$${baseForMaskedValues + values.length + 2}`;
          sql += `${field} BETWEEN ${firstValue} AND ${secondValue}`;
          values.push(condition.values[0]);
          values.push(condition.values[1]);
          break;
        case 'in':
          const maskedValues = condition.values.map((_, index) => {
            return `$${baseForMaskedValues + values.length + 1 + index}`;
          });

          sql += `${field} IN (${maskedValues.join(',')})`;
          condition.values.forEach(value => {
            values.push(value);
          });
          break;
      }

      if (index !== this.conditions.length - 1) {
        sql += ' AND ';
      }
    });

    return { sql, values };
  }
}

export default KwilDBTable;
