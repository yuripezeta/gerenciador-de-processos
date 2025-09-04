import { createServer, Model } from 'miragejs';

export function makeServer() {
  return createServer({
    models: {
      form: Model,
      budgetItem: Model
    },

    seeds(server) {
      server.create('budgetItem', { id: '1', name: 'Rubrica 1', value: 10000 });
      server.create('budgetItem', { id: '2', name: 'Rubrica 2', value: 20000 });
    },

    routes() {
      this.namespace = 'api';
      this.get('/budget-items', (schema) => schema.budgetItems.all());
      this.post('/forms', (schema, request) => {
        return schema.forms.create(JSON.parse(request.requestBody));
      });
    }
  });
}