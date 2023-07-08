export default {
    "sql": {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "",
        "port": 3307
    },

    "channels": {
        "welcome_channel": "1026593619425099806", // canal de mensagem de bem vindo
        "exit_channel": "1026593619425099806" // canal de mensagem de log de saida
    },

    "whitelist": {
        "channelRole": "941921134629240863", // canal aonde será recebido o id
        "WhitelistIsOpen": true, // Coloque como "false" caso queira que a whitelist seja desabilitada
        "simultaneousWhitelist": 20, // limite de quantas whitelist podem serem feitas ao mesmo tempo
        "category": "966213242164760617", // categoria aonde o canal de whitelist será criado
        "result": "958787034376470559", // canal aonde o resultado será postado
        "staff": "492018401590640640", // cargo necessario para aprovar / reprovar whitelists
        "channel": "1026593756239110144", // canal aonde será enviado as whitelist para serem lidas
        "waiting_role": "966214354318032986", // cargo que será recebido quando o membro fizer a wl (aguardado resultado da whitelist)
        "approved_role": "928511798796222464", // cargo que será recebido quando o membro for aprovado na wl (aguardado liberação de ID ou HEX)
        "questions": [
            { id: '01', question: 'Oque você considera como anti-rp?', time: 5, caracteres: 256 },
            { id: '02', question: 'Oque você considera como power-gamming?', time: 5, caracteres: 256 },
            { id: '03', question: 'Oque você considera como meta-gamming?', time: 5, caracteres: 256 },
            { id: '04', question: 'Você está na rua e é abordado por 2 pessoas armadas, e você está armado, oque você faria?', time: 5, caracteres: 256 },
            { id: '05', question: 'Informe a historia do seu personagem', time: 10, caracteres: 4000, history: true } // UTILIZE SOMENTE O HISTORY: TRUE CASO SEJA REALMENTE A HISTORIA DO PERSONAGEM! SÓ PODE SER UTILIZADO EM 1 LOCAL
        ]
    },

    "liberation": {
        "rename": "909881052900778055", // canal aonde será enviado o discord, id e nome do personagem para renomear o membro do discord!
        "channel": "928512041097003059", // canal aonde o membro vai enviar hex // id para liberação
        "addRole": "720476376871731241", // cargo que será entregue quando o ID for liberado!
        "removeRole": "928511798796222464", // cargo que será removido quando o ID for liberado!
        "table": "accounts", 
        "column": "whitelist",
        "identifier": "id"
    },

    "ticket": {
        "category": "966196123561775104", // categoria aonde o canal de texto de ticket será criado
        "staff": "492018401590640640", // cargo que terá acesso ao ticket
        "prefix": "chamado-", // prefix de como o ticket será criado (exemplo ticket-0001)
        "table": "discord", // tabela aonde ficará registrado todas as informações sobre tickets
        "categories": [
            {
                label: 'Denuncia',
                description: 'Ticket para efetuar denuncias',
                value: 'Atendimento para denuncias',
            },{
                label: 'Beneficios',
                description: 'Ticket para atendimento relacionado a doações',
                value: 'Atendimento para beneficios',
            },{
                label: 'Atendimento',
                description: 'Ticket para atendimento geral ao usuário',
                value: 'Atendimento e suporte ao usuário',
            }
        ]
    }
}