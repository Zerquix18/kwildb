# KwilDB Query Builder

This is a query builder for [KwilDB](https://kwil.com/), using the [KwilDB's API](https://github.com/kwilteam/kwil_db_api).

## Initializing & Connecting

You have to first create an instance for kwildb, which allows you to have multiple connections.

```javascript
import KwilDBBuilder from './src/kwildb';

const secretKey = '';

const kwildb = new KwilDBBuilder(secretKey, false);
```

You can specify whether you want to propagate your changes with the second parameter of the KwilDBBuilder constructor.

With the instance ready, you can connect using your moat and private key:

```javascript
const privateKey = JSON.parse(fs.readFileSync('./key.json').toString());
const moat = 'luistest';
kwildb.connect({ moat, privateKey });
```

The values for the first parameter of connect include:

* **host** (optional) defaults to `test-db.kwil.xyz`.
* **protocol**: (optional) defaults to `https`.
* **moat**: (required) Your moat.
* **privateKey**: (required) Your private key.

This will create a connection called `default`. You can give your connection a name by passing it as the second parameter. You can then change your connection using `kwildb.setCurrentConnection('default')`.

## Create a schema

You can create a schema using the `createSchema` method.

```javascript
  await kwildb.createSchema('public');
```

You can also drop it:

```javascript
  await kwildb.dropSchema('public');
```

## Create tables

You can create tables using the `createTable` method.

```javascript
  await kwildb.createTable('posts', {
    id: 'integer',
    title: 'varchar(30)',
    content: 'text',
  });
``` 

And delete them using `dropTable`:

```javascript
  await kwildb.dropTable('posts');
```

## Inserting

You can do an INSERT using the `insert` method, which accepts an array with a list of key-value:

```javascript
  const usersToAdd = [
    { id: 1, email: 'contact@zerquix18.com', name: 'Luis' },
    { id: 2, email: 'contact+2@zerquix18.com', name: 'Luis 2' },
    { id: 3, email: 'contact+3@zerquix18.com', name: 'Luis 3' },
  ];

  const result = await kwildb.table('users').insert(usersToAdd);

  console.log(result); // { affectedRows: 3 }
```

## Updating

The `update` method allows you to perform an UPDATE. It accepts a key-value for the things to set. You can specify which item to update using `where`.
`where` takes a field, an operator (=, <, >, like) and a value.

```javascript
  const result = await kwildb.table('users').where('id', '=', 1).update({ name: 'luis!' });
  console.log(result); // { affectedRows: 1 }
```

## Deleting

The `delete` method allows you to perform a DELETE FROM.

```javascript
  const result = await kwildb.table('users').where('id', '=', 1).delete();
  console.log(result); // { affectedRows: 1 }
```

You can also truncate an entire table:

```javascript
  await kwildb.table('users').truncate();
```

## Selecting

### Listing all items

You can list items using the `get` method:

```javascript
  const users = await kwildb.table('users').get();
  console.log(users);
  /*
    [
      { id: 1, email: 'contact@zerquix18.com', name: 'Luis' },
      { id: 2, email: 'contact+2@zerquix18.com', name: 'Luis 2' },
      { id: 3, email: 'contact+3@zerquix18.com', name: 'Luis 3' }
    ]
  */
```

#### Conditions

You can reduce the amount of result using the `where` function:

```javascript
  const users = await kwildb.table('users').where('id', '=', 1).get();
  const users2 = await kwildb.table('users').where('id', '!=', 1).get();
  const users3 = await kwildb.table('users').where('id', '>', 1).get();
  const users4 = await kwildb.table('users').where('id', '<', 2).get();
  const users5 = await kwildb.table('users').where('id', 'like', 'contact%').get();
  console.log(users, users2, users3, users4, users5);
```

There other functions for special comparisons:

```javascript
  const users = await kwildb.table('users').whereNull('id').get();
  const users2 = await kwildb.table('users').whereNotNull('id').get();
  const users3 = await kwildb.table('users').whereIn('id', [1, 2, 3, 4, 5]).get();
  const users4 = await kwildb.table('users').whereBetween('id', [0, 10]).get();
  console.log(users, users2, users3, users4);
```

#### Limit

You can limit how many results you get by using the `limit` method:

```javascript
  const users = await kwildb.table('users').limit(2).get();
  console.log(users);
```

#### Sort By

You can sort using the `sortBy` method:

```javascript
  const users = await kwildb.table('users').orderBy('id', 'desc').get();
  const users2 = await kwildb.table('users').orderBy('id', 'asc').get();
  console.log(users, users2);
``` 

### Listing a specific item

You can quickly find an id using the `find` function:

```javascript
  const user = await kwildb.table('users').find(1); // finds where ID = 1, returns object
  console.log(user);
```

You can quickly get the first result of a query using the `first` method:

```javascript
  const user = await kwildb.table('users').first();
  console.log(user);
``` 


### Aggregate functions

There are aggregate functions to get data from your table:

```javascript
  const count = await kwildb.table('users').count(); // 3
  const max = await kwildb.table('users').max('id'); // 3
  const min = await kwildb.table('users').min('id'); // 1
  const avg = await kwildb.table('users').avg('id'); // 2
  const sum = await kwildb.table('users').sum('id'); // 6

  console.log(find, count, max, min, avg, sum);
```

## Raw queries, prepared statements

You can use the `query` and `preparedStatement` to perform custom queries.

## Error handling

If the query is wrong, an exception will be thrown. You should always catch the exception.

```javascript
try {
  const result = await kwildb.table('non existing table').get();
  console.log(result);
} catch (e) {
  console.log(e);
}
```

