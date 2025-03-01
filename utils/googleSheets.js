const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function getAuthClient() {
    try {

        if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
            throw new Error('Credenciais do Google Sheets não configuradas no ambiente');
        }

        const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);

        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        await auth.authorize();
        return auth;
    } catch (error) {
        console.error('Erro ao autenticar com o Google Sheets:', error);
        throw error;
    }
}

async function addCraftToSheet(craftData) {
    try {

        const auth = await getAuthClient();

        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        const range = 'Registros!A:G';

        const timestamp = new Date().toISOString();
        const values = [
            [
                timestamp,
                craftData.username,
                craftData.nome,
                craftData.id,
                craftData.quantidade,
                craftData.tipo,
                craftData.motivo || '-'
            ]
        ];

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return response.data;
    } catch (error) {
        console.error('Erro ao adicionar craft à planilha:', error);
        throw error;
    }
}

async function getCraftsSummary() {
    try {

        const auth = await getAuthClient();


        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        const range = 'Registros!A:G';

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });

        const rows = response.data.values || [];

        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const recentCrafts = rows.slice(1).filter(row => {
            if (!row[0]) return false;
            const rowDate = new Date(row[0]);
            return rowDate >= oneDayAgo;
        });

        return recentCrafts;
    } catch (error) {
        console.error('Erro ao obter resumo de crafts:', error);
        throw error;
    }
}

module.exports = {
    addCraftToSheet,
    getCraftsSummary
};