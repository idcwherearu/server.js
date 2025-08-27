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
    java.lang.System.out.println("🔧 Загрузка AutoMine скрипта...");
    
    try {
        var ChatUtility = Java.type("ru.nedan.neverapi.etc.ChatUtility");
        var AutoMine = Java.type("ru.nedan.automine.AutoMine");
        var Utils = Java.type("ru.nedan.automine.util.Utils");
        
        java.lang.System.out.println("✅ Классы загружены: " + 
            (ChatUtility ? "ChatUtility " : "") +
            (AutoMine ? "AutoMine " : "") +
            (Utils ? "Utils" : "")
        );
        
        // Проверяем доступность on() функции
        if (typeof on !== 'function') {
            java.lang.System.err.println("❌ Функция on() не найдена!");
            return;
        }
        
        // Регистрируем несколько возможных событий
        on("ru.nedan.automine.event.EventStaffJoin", function(e) {
            java.lang.System.out.println("🎯 EventStaffJoin: " + e.getUsername());
            handleStaffJoin(e);
        });
        
        on("ru.nedan.automine.event.StaffJoinEvent", function(e) {
            java.lang.System.out.println("🎯 StaffJoinEvent: " + (e.getUsername ? e.getUsername() : 'unknown'));
            handleStaffJoin(e);
        });
        
        on("ru.nedan.automine.StaffJoinEvent", function(e) {
            java.lang.System.out.println("🎯 StaffJoinEvent (short): " + (e.getUsername ? e.getUsername() : 'unknown'));
            handleStaffJoin(e);
        });
        
        // Функция обработки
        function handleStaffJoin(e) {
            try {
                java.lang.System.out.println("👤 Стафф присоединился: " + e.getUsername());
                
                if(!AutoMine.getInstance().isEnabled()) {
                    java.lang.System.out.println("⏸️ AutoMine отключен");
                    return;
                }
                
                var anarchy = Utils.getCurrentAnarchy ? Utils.getCurrentAnarchy() : "Анархию";
                
                ChatUtility.sendMessage("§4§l[!] " + e.getUsername() + "§c Зашел на " + anarchy + "! §bВыхожу в хуб!");
                ChatUtility.sendMessage("§8§l§kxxxxxxxxxx");
                ChatUtility.sendMessage("§9§lПривет от Zr3!");
                
                // Пробуем разные варианты выхода
                try {
                    chat("/hub");
                    java.lang.System.out.println("✅ Команда /hub отправлена");
                } catch (cmdError) {
                    java.lang.System.err.println("❌ Ошибка команды /hub: " + cmdError);
                }
                
                AutoMine.getInstance().nextMine = true;
                java.lang.System.out.println("✅ nextMine установлен в true");
                
            } catch (error) {
                java.lang.System.err.println("❌ Ошибка в handleStaffJoin: " + error);
            }
        }
        
        // Дополнительно: слушаем все события для диагностики
        on("ru.nedan.automine.event.", function(e) {
            java.lang.System.out.println("📢 Любое событие AutoMine: " + e.toString().substring(0, 100));
        });
        
        java.lang.System.out.println("✅ Все события зарегистрированы");
        
    } catch (e) {
        java.lang.System.err.println("❌ Критическая ошибка: " + e.toString());
    }
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
