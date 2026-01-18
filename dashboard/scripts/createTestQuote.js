/**
 * SCRIPT DE TESTE - Criar Orçamento Completo
 * 
 * Execute este script no Console do navegador (F12) para criar
 * um orçamento de teste completo com todos os campos necessários
 * para testar as funcionalidades do Sistema de Gêmeo Digital.
 * 
 * COMO USAR:
 * 1. Acesse: http://localhost:5173/admin/quotes/new
 * 2. Abra Console (F12)
 * 3. Cole este código completo
 * 4. Pressione Enter
 * 5. Preencha o cliente e salve
 * 6. Orçamento estará pronto para validar!
 */

// Importar Firestore (se não estiver disponível, use o método manual abaixo)
const { addDoc, collection } = window.firebaseExports || {};
const { db } = window.firebaseExports || {};

// ============================================================================
// MÉTODO 1: Via Interface (Recomendado)
// ============================================================================

console.log('🎯 CRIANDO ORÇAMENTO DE TESTE...');
console.log('');
console.log('📋 PASSO A PASSO:');
console.log('1. Selecione um cliente (ou crie um novo)');
console.log('2. Clique "+ Adicionar Item de Instalação"');
console.log('3. No modal, preencha:');
console.log('   - Serviço: "Cortina de Vidro"');
console.log('   - Largura: 6500 (mm)');
console.log('   - Altura: 2400 (mm)');
console.log('   - Cor Vidro: Bronze');
console.log('   - Cor Perfil: Bronze');
console.log('   - Lado de Abertura: ⬅️ Esquerda');
console.log('4. Salve o item');
console.log('5. Salve o orçamento');
console.log('');
console.log('✅ Depois:');
console.log('- Vá para /admin/quotes');
console.log('- Clique "👁️ Validar" no orçamento');
console.log('- Veja os rótulos F1, F2, F3... e setas!');

// ============================================================================
// MÉTODO 2: Dados para Copiar/Colar
// ============================================================================

const dadosExemplo = {
  serviceName: 'Cortina de Vidro',
  quantity: 1,
  unitPrice: 850,
  total: 1500,
  pricingMethod: 'm2',
  dimensions: {
    width: 6500,    // 6.5 metros
    height: 2400,   // 2.4 metros
    area: 15.6,     // m²
  },
  glassColor: 'Bronze',
  glassThickness: '8mm',
  profileColor: 'Bronze',
  ladoAbertura: 'esquerda',
  isInstallation: true,
  engine_config_snapshot: {
    engine_id: 'sacada_ks',
    regras_fisicas: {
      tipo_movimento: 'empilhavel',
      tem_pivo: true,
      folgas: {
        padrao: 15,
        lateral: 20,
        superior: 15,
        inferior: 15
      },
      fator_empilhamento: 0.04,
      largura_minima_folha: 0.5,
      largura_maxima_folha: 1.0,
      espessuras_vidro_permitidas: [6, 8, 10],
      espessura_vidro_padrao: 8,
      tipo_vidro_obrigatorio: 'temperado',
      calcular_folhas_automatico: true,
      quantidade_folhas: 8
    },
    mapeamento_materiais: {
      vidro: {
        bronze: { hex: '#CD7F32', nome: 'Bronze' }
      },
      perfil: {
        bronze: { hex: '#CD7F32', nome: 'Bronze' }
      }
    }
  },
  usar_engenharia: true
};

console.log('');
console.log('📦 DADOS PARA TESTAR:');
console.log(JSON.stringify(dadosExemplo, null, 2));

// ============================================================================
// MÉTODO 3: Auto-preencher Formulário (Se estiver na página certa)
// ============================================================================

if (window.location.pathname === '/admin/quotes/new') {
  console.log('');
  console.log('✨ Página detectada! Use a interface para criar o item.');
  console.log('');
  console.log('🎯 ATALHO RÁPIDO:');
  console.log('- Clique no botão verde "+ Adicionar Item de Instalação"');
  console.log('- Preencha o modal conforme instruções acima');
  console.log('- O sistema gerará engine_config_snapshot automaticamente!');
}

// ============================================================================
// VERIFICAÇÃO
// ============================================================================

console.log('');
console.log('🔍 PARA VERIFICAR SE FUNCIONOU:');
console.log('1. Salve o orçamento');
console.log('2. Vá para /admin/quotes');
console.log('3. Encontre seu orçamento');
console.log('4. Clique "👁️ Validar"');
console.log('5. Deve abrir modal com renderização!');
console.log('');
console.log('🎨 O QUE VOCÊ DEVE VER:');
console.log('- Folhas numeradas (F1, F2, F3...)');
console.log('- Setas de direção (⬅️)');
console.log('- Labels (MÓVEL, PIVÔ)');
console.log('- Bronze no tom #cd7f32');
console.log('- Checklist com validações');

// ============================================================================
// EXPORTAR PARA USO
// ============================================================================

window.__testQuoteData = dadosExemplo;
console.log('');
console.log('💾 Dados salvos em: window.__testQuoteData');
