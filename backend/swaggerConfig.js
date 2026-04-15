const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ames After Dark API',
      version: '1.0.0',
      description: 'API documentation for Ames After Dark',
      contact: {
        name: 'Ames After Dark',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
      {
        url: 'https://apidev.amesafterdark.com',
        description: 'Development server',
      },
      {
        url: 'https://api.amesafterdark.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Auth0 JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            auth0Id: {
              type: 'string',
              description: 'Auth0 unique identifier',
            },
            username: {
              type: 'string',
              description: 'User username',
            },
            email: {
              type: 'string',
              description: 'User email address',
            },
            profilePhoto: {
              type: 'string',
              description: 'Profile photo URL',
            },
            bio: {
              type: 'string',
              description: 'User bio',
            },
            isAdmin: {
              type: 'boolean',
              description: 'Admin status',
            },
            isDeveloper: {
              type: 'boolean',
              description: 'Developer status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Location ID',
            },
            name: {
              type: 'string',
              description: 'Location name',
            },
            address: {
              type: 'string',
              description: 'Street address',
            },
            latitude: {
              type: 'number',
              description: 'GPS latitude',
            },
            longitude: {
              type: 'number',
              description: 'GPS longitude',
            },
            phoneNumber: {
              type: 'string',
              description: 'Contact phone number',
            },
            website: {
              type: 'string',
              description: 'Website URL',
            },
            description: {
              type: 'string',
              description: 'Location description',
            },
            imageUrl: {
              type: 'string',
              description: 'Main image URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        LocationHour: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'LocationHour ID',
            },
            locationId: {
              type: 'string',
              description: 'Associated location ID',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: 'Day of week (0=Sunday, 6=Saturday)',
            },
            openTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Opening time (HH:mm format)',
            },
            closeTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Closing time (HH:mm format)',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Event ID',
            },
            locationId: {
              type: 'string',
              description: 'Associated location ID',
            },
            title: {
              type: 'string',
              description: 'Event title',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Event start time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Event end time',
            },
            imageUrl: {
              type: 'string',
              description: 'Event image URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Deal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Deal ID',
            },
            locationId: {
              type: 'string',
              description: 'Associated location ID',
            },
            title: {
              type: 'string',
              description: 'Deal title',
            },
            description: {
              type: 'string',
              description: 'Deal description',
            },
            discount: {
              type: 'string',
              description: 'Discount details',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Deal start date',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Deal end date',
            },
            imageUrl: {
              type: 'string',
              description: 'Deal image URL',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Error details',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Locations',
        description: 'Operations related to bar/venue locations',
      },
      {
        name: 'Location Hours',
        description: 'Operations related to location operating hours',
      },
      {
        name: 'Users',
        description: 'User authentication and profile operations',
      },
      {
        name: 'Events',
        description: 'Operations related to events at locations',
      },
      {
        name: 'Deals',
        description: 'Operations related to special deals and promotions',
      },
      {
        name: 'Friendships',
        description: 'User friendship and social operations',
      },
      {
        name: 'Favorites',
        description: 'User favorite locations and drinks',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
