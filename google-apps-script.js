/**
 * Google Apps Script para receber dados do formulário e salvar no Google Sheets
 * 
 * INSTRUÇÕES:
 * 1. Acesse https://script.google.com
 * 2. Crie um novo projeto
 * 3. Cole este código
 * 4. Publique como aplicativo web (Executar como: Eu, Quem tem acesso: Qualquer pessoa)
 * 5. Copie a URL e substitua no arquivo WhatsAppModal.tsx (linha 117)
 */

function doPost(e) {
  try {
    // Nome da sua planilha (aba)
    const SHEET_NAME = 'Página1';
    
    // ID da sua planilha
    const SPREADSHEET_ID = '18ZTTPPWBfnKmWrJl86zE0QD4EczGPr6u-mJ2c56RxCA';
    
    // Abre a planilha
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Se a planilha não existir, cria
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Adiciona cabeçalhos
      sheet.appendRow([
        'Nome',
        'Telefone',
        'GCLID',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
        'Timestamp',
        'Page URL',
        'User Agent'
      ]);
      // Formata cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285F4');
      headerRange.setFontColor('#FFFFFF');
    }
    
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Prepara a linha para inserir
    const row = [
      data.nome || '',
      data.telefone || '',
      data.gclid || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.timestamp || new Date().toISOString(),
      data.page_url || '',
      data.user_agent || ''
    ];
    
    // Adiciona a linha na planilha
    sheet.appendRow(row);
    
    // Retorna sucesso
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Data saved successfully' 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Retorna erro
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para testar (opcional)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    message: 'Google Apps Script is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
