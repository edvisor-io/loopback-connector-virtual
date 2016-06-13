# Virtual Loopback connector

A simple connector that allows the server to create a "fake" model object on any method call. By using a connector, any loopback functionality like including other models on the fake model is retained. This can be useful, when a model needs to be constructed through combining and manipulating persistend models, but should behave like any other loopback model.

## Usage

### 1. define the virtual datasource in your project

In your `datasources.json` add the connector to your existing datasources:

```js
{
  ...

  "virtual": {
    "name": "virtual",
    "connector": "virtual"
  }
}
```

### 2. Define a virtual model

Define the model that is going to be constructed instead of fetched from a persistend datasource. You would add this to your `model-config.json`:

```js
{
  "Unicorn": {
    "dataSource": "virtual",
    "public": true
  },

  ...,

  "Foal": {
    "dataSource": "mysql",
    "public": true
  }
}
```

Furthermore, define the model itself in `Unicorn.json`, maybe with relations to non-virtual models.

```js
{
  "name": "Unicorn",
  "options": {
    "idInjection": false,
    "relations": {
      "foals": {
        "model": "Foal",
        "type": "hasMany",
        "foreignKey": "horseId"
      }
    }
  },
  "properties": {
    ...
  }
}
```

### 3. Define how the virtual model should be constucted

Define a method that should be called whenever loopback is trying to find a Unicorn model in `unicorn.js`:

```js
module.exports = function(Unicorn) {
  Unicorn.findUnicorn = function(instance, filters, options, cb) {
    server.models.Horse.find(filter, function(err, horse) {
      server.models.Horn.find(filter, function(err, horn) {
        cb(err, horse.add(horn)); // a fake unicorn !!!
      })
    })
  }
}
```

### 4. Initilize the connector on boot time

Create a script file in your projects `boot` folder and initilize the connector with your server and what connector method(s) should map to what server method. In this example, we want any call of `Unicorn.find()` to be re-routed to `Unicorn.findUnicorn()`

```js
module.exports = function initilizeVirtualConnector(server) {
  var virtualSettings = server.datasources.virtual.connector.settings;
  virtualSettings.server = server;
  virtualSettings.mapping = {
    all: [{
      Model: 'Unicorn',
      method: 'findUnicorn'
    }]
  };
```

### 5. Query the virtual model and any related models

- `GET unicorn/1`: just return the data returned from `Unicorn.findUnicorn()`
- `GET unicorn/1?filter={include:"foals"}`: get the data from `Unicorn.findUnicorn()` and find all relations for which the foreign key matches. It does not matter to what datasource the relation model is connected to.
- `GET stable/1?filter={include:"unicorns"}`: virtual models can also be included from parent models as you would expect.
