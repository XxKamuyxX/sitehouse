/**
 * SCRIPT DE SEED - TEMPLATES COM CONFIGURAÇÃO DE ENGENHARIA
 * 
 * Este script popula o Firestore com templates iniciais contendo
 * as configurações de engenharia (engine_config) para o sistema
 * de Gêmeo Digital.
 * 
 * USO:
 * npm run seed:templates
 * 
 * ou
 * 
 * ts-node scripts/seedTemplates.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// TEMPLATES
// ============================================================================

const TEMPLATES = [
  // ---------------------------------------------------------------------------
  // 1. SACADA KS
  // ---------------------------------------------------------------------------
  {
    name: 'Sacada KS - Envidraçamento',
    category: 'Envidraçamento',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/vidracaria-house.appspot.com/o/templates%2Fsacada-ks-placeholder.jpg?alt=media',
    active: true,
    tags: ['sacada', 'envidraçamento', 'empilhavel', 'ks'],
    createdAt: Timestamp.now(),
    
    engine_config: {
      engine_id: 'sacada_ks',
      engine_name: 'Sacada KS - Sistema de Empilhamento',
      engine_version: '1.0.0',
      
      regras_fisicas: {
        tem_pivo: true,
        numero_folhas: 6,
        tipo_movimento: 'empilhavel',
        
        folgas: {
          padrao: 15,
          lateral: 20,
          superior: 15,
          inferior: 15,
          empilhamento: 40,
        },
        
        espessuras_vidro_permitidas: [6, 8, 10],
        espessura_vidro_padrao: 8,
        tipos_vidro_permitidos: ['temperado'],
        tipo_perfil: 'linha_ks_standard',
        
        dimensoes_minimas: {
          largura: 1.5,
          altura: 1.2,
        },
        
        dimensoes_maximas: {
          largura: 12.0,
          altura: 3.0,
        },
        
        area_maxima_folha: 2.5,
        peso_maximo_folha: 50,
        
        calcular_folhas_automatico: true,
        largura_minima_folha: 0.5,
        largura_maxima_folha: 1.0,
        
        acessorios_obrigatorios: [
          {
            nome: 'Pivô Central KS',
            quantidade_formula: '1',
            preco_unitario: 450.00,
          },
          {
            nome: 'Perfil Trilho Superior',
            quantidade_formula: 'largura_total',
            preco_unitario: 120.00,
          },
          {
            nome: 'Perfil Trilho Inferior',
            quantidade_formula: 'largura_total',
            preco_unitario: 110.00,
          },
          {
            nome: 'Roldana',
            quantidade_formula: 'numero_folhas * 4',
            preco_unitario: 15.00,
          },
          {
            nome: 'Fecho Imantado',
            quantidade_formula: 'numero_folhas',
            preco_unitario: 35.00,
          },
        ],
        
        acessorios_opcionais: [
          {
            nome: 'Trava de Segurança',
            preco_unitario: 85.00,
          },
          {
            nome: 'Vedação de Escova',
            preco_unitario: 25.00,
          },
        ],
        
        regras_customizadas: {
          permitir_folhas_asimetricas: false,
          exigir_numero_folhas_par: true,
          calcular_peso_estrutura: true,
        },
      },
      
      mapeamento_materiais: {
        vidro: {
          'incolor': {
            nome: 'Vidro Incolor',
            hex: '#E8F4F8',
            opacity: 0.3,
          },
          'verde': {
            nome: 'Vidro Verde',
            hex: '#C8E6C9',
            opacity: 0.4,
          },
          'fume': {
            nome: 'Vidro Fumê',
            hex: '#90A4AE',
            opacity: 0.5,
          },
          'bronze': {
            nome: 'Vidro Bronze',
            hex: '#BCAAA4',
            opacity: 0.4,
          },
        },
        
        perfil: {
          'branco': {
            nome: 'Alumínio Branco',
            hex: '#FFFFFF',
            acabamento: 'fosco',
          },
          'preto': {
            nome: 'Alumínio Preto',
            hex: '#212121',
            acabamento: 'anodizado',
          },
          'bronze': {
            nome: 'Alumínio Bronze',
            hex: '#8D6E63',
            acabamento: 'anodizado',
          },
          'natural': {
            nome: 'Alumínio Natural',
            hex: '#E0E0E0',
            acabamento: 'anodizado',
          },
        },
        
        acessorios: {
          'cromado': {
            nome: 'Cromado',
            hex: '#C0C0C0',
          },
          'preto_fosco': {
            nome: 'Preto Fosco',
            hex: '#424242',
          },
        },
      },
      
      metadata: {
        ultima_atualizacao: Timestamp.now(),
        autor: 'Equipe Gestor Vitreo',
        notas: 'Configuração padrão para sistema KS. Testado e validado em centenas de instalações.',
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // 2. JANELA 4 FOLHAS DE CORRER
  // ---------------------------------------------------------------------------
  {
    name: 'Janela 4 Folhas de Correr',
    category: 'Janelas',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/vidracaria-house.appspot.com/o/templates%2Fjanela-4-folhas-placeholder.jpg?alt=media',
    active: true,
    tags: ['janela', 'correr', '4-folhas'],
    createdAt: Timestamp.now(),
    
    engine_config: {
      engine_id: 'janela_correr',
      engine_name: 'Janela de Correr - 4 Folhas',
      engine_version: '1.0.0',
      
      regras_fisicas: {
        tem_pivo: false,
        numero_folhas: 4,
        tipo_movimento: 'correr',
        
        folgas: {
          padrao: 12,
          lateral: 15,
          superior: 12,
          inferior: 12,
        },
        
        espessuras_vidro_permitidas: [4, 6, 8],
        espessura_vidro_padrao: 6,
        tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
        tipo_perfil: 'linha_25_esquadria',
        
        dimensoes_minimas: {
          largura: 1.2,
          altura: 1.0,
        },
        
        dimensoes_maximas: {
          largura: 3.0,
          altura: 2.2,
        },
        
        area_maxima_folha: 1.8,
        peso_maximo_folha: 35,
        
        calcular_folhas_automatico: false,
        
        acessorios_obrigatorios: [
          {
            nome: 'Marco de Alumínio',
            quantidade_formula: '(largura_total + altura_total) * 2',
            preco_unitario: 85.00,
          },
          {
            nome: 'Trilho de Correr',
            quantidade_formula: 'largura_total * 2',
            preco_unitario: 65.00,
          },
          {
            nome: 'Roldana de Nylon',
            quantidade_formula: 'numero_folhas * 2',
            preco_unitario: 12.00,
          },
          {
            nome: 'Fecho Concha',
            quantidade_formula: '2',
            preco_unitario: 18.00,
          },
          {
            nome: 'Trava de Segurança',
            quantidade_formula: '2',
            preco_unitario: 22.00,
          },
        ],
        
        acessorios_opcionais: [
          {
            nome: 'Tela Mosquiteiro',
            preco_unitario: 180.00,
          },
          {
            nome: 'Persiana Integrada',
            preco_unitario: 450.00,
          },
        ],
        
        regras_customizadas: {
          folhas_fixas: [1, 4],
          sobreposicao_folhas: 0.05,
          permitir_numero_folhas_variavel: false,
        },
      },
      
      mapeamento_materiais: {
        vidro: {
          'incolor': {
            nome: 'Vidro Incolor Transparente',
            hex: '#F5F9FA',
            opacity: 0.2,
          },
          'verde': {
            nome: 'Vidro Verde',
            hex: '#C8E6C9',
            opacity: 0.35,
          },
          'fume': {
            nome: 'Vidro Fumê',
            hex: '#9E9E9E',
            opacity: 0.45,
          },
          'laminado_incolor': {
            nome: 'Laminado Incolor',
            hex: '#E3F2FD',
            opacity: 0.25,
          },
        },
        
        perfil: {
          'branco': {
            nome: 'Alumínio Branco',
            hex: '#FAFAFA',
            acabamento: 'fosco',
          },
          'preto': {
            nome: 'Alumínio Preto',
            hex: '#263238',
            acabamento: 'anodizado',
          },
          'champagne': {
            nome: 'Alumínio Champagne',
            hex: '#D7CCC8',
            acabamento: 'anodizado',
          },
          'bronze': {
            nome: 'Alumínio Bronze',
            hex: '#8D6E63',
            acabamento: 'anodizado',
          },
        },
        
        acessorios: {
          'cromado': {
            nome: 'Cromado Brilhante',
            hex: '#E0E0E0',
          },
          'preto_fosco': {
            nome: 'Preto Fosco',
            hex: '#37474F',
          },
          'dourado': {
            nome: 'Dourado',
            hex: '#FFD700',
          },
        },
      },
      
      metadata: {
        ultima_atualizacao: Timestamp.now(),
        autor: 'Equipe Gestor Vitreo',
        notas: 'Modelo clássico de janela 4 folhas. Folhas 1 e 4 fixas, folhas 2 e 3 móveis.',
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // 3. JANELA 2 FOLHAS DE CORRER
  // ---------------------------------------------------------------------------
  {
    name: 'Janela 2 Folhas de Correr',
    category: 'Janelas',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/vidracaria-house.appspot.com/o/templates%2Fjanela-2-folhas-placeholder.jpg?alt=media',
    active: true,
    tags: ['janela', 'correr', '2-folhas'],
    createdAt: Timestamp.now(),
    
    engine_config: {
      engine_id: 'janela_correr',
      engine_name: 'Janela de Correr - 2 Folhas',
      engine_version: '1.0.0',
      
      regras_fisicas: {
        tem_pivo: false,
        numero_folhas: 2,
        tipo_movimento: 'correr',
        
        folgas: {
          padrao: 12,
          lateral: 15,
          superior: 12,
          inferior: 12,
        },
        
        espessuras_vidro_permitidas: [4, 6, 8],
        espessura_vidro_padrao: 6,
        tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
        tipo_perfil: 'linha_25_esquadria',
        
        dimensoes_minimas: {
          largura: 0.8,
          altura: 0.8,
        },
        
        dimensoes_maximas: {
          largura: 2.0,
          altura: 2.0,
        },
        
        area_maxima_folha: 2.0,
        peso_maximo_folha: 40,
        
        calcular_folhas_automatico: false,
        
        acessorios_obrigatorios: [
          {
            nome: 'Marco de Alumínio',
            quantidade_formula: '(largura_total + altura_total) * 2',
            preco_unitario: 85.00,
          },
          {
            nome: 'Trilho de Correr',
            quantidade_formula: 'largura_total * 2',
            preco_unitario: 65.00,
          },
          {
            nome: 'Roldana de Nylon',
            quantidade_formula: 'numero_folhas * 2',
            preco_unitario: 12.00,
          },
          {
            nome: 'Fecho Concha',
            quantidade_formula: '1',
            preco_unitario: 18.00,
          },
        ],
        
        acessorios_opcionais: [
          {
            nome: 'Tela Mosquiteiro',
            preco_unitario: 120.00,
          },
        ],
        
        regras_customizadas: {
          folhas_fixas: [1],
          sobreposicao_folhas: 0.05,
          permitir_numero_folhas_variavel: false,
        },
      },
      
      mapeamento_materiais: {
        vidro: {
          'incolor': {
            nome: 'Vidro Incolor Transparente',
            hex: '#F5F9FA',
            opacity: 0.2,
          },
          'verde': {
            nome: 'Vidro Verde',
            hex: '#C8E6C9',
            opacity: 0.35,
          },
          'fume': {
            nome: 'Vidro Fumê',
            hex: '#9E9E9E',
            opacity: 0.45,
          },
        },
        
        perfil: {
          'branco': {
            nome: 'Alumínio Branco',
            hex: '#FAFAFA',
            acabamento: 'fosco',
          },
          'preto': {
            nome: 'Alumínio Preto',
            hex: '#263238',
            acabamento: 'anodizado',
          },
          'bronze': {
            nome: 'Alumínio Bronze',
            hex: '#8D6E63',
            acabamento: 'anodizado',
          },
        },
        
        acessorios: {
          'cromado': {
            nome: 'Cromado',
            hex: '#E0E0E0',
          },
          'preto_fosco': {
            nome: 'Preto Fosco',
            hex: '#37474F',
          },
        },
      },
      
      metadata: {
        ultima_atualizacao: Timestamp.now(),
        autor: 'Equipe Gestor Vitreo',
        notas: 'Janela compacta 2 folhas. Folha 1 fixa, folha 2 móvel.',
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // 4. BOX FRONTAL
  // ---------------------------------------------------------------------------
  {
    name: 'Box de Banheiro Frontal',
    category: 'Box',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/vidracaria-house.appspot.com/o/templates%2Fbox-frontal-placeholder.jpg?alt=media',
    active: true,
    tags: ['box', 'banheiro', 'frontal'],
    createdAt: Timestamp.now(),
    
    engine_config: {
      engine_id: 'box_frontal',
      engine_name: 'Box Frontal - 1 Fixo + 1 Móvel',
      engine_version: '1.0.0',
      
      regras_fisicas: {
        tem_pivo: false,
        numero_folhas: 2,
        tipo_movimento: 'correr',
        
        folgas: {
          padrao: 10,
          lateral: 12,
          superior: 10,
          inferior: 20,
        },
        
        espessuras_vidro_permitidas: [8, 10],
        espessura_vidro_padrao: 8,
        tipos_vidro_permitidos: ['temperado'],
        tipo_perfil: 'linha_box_standard',
        
        dimensoes_minimas: {
          largura: 0.7,
          altura: 1.8,
        },
        
        dimensoes_maximas: {
          largura: 1.8,
          altura: 2.2,
        },
        
        area_maxima_folha: 2.5,
        peso_maximo_folha: 45,
        
        calcular_folhas_automatico: false,
        
        acessorios_obrigatorios: [
          {
            nome: 'Perfil U Superior',
            quantidade_formula: 'largura_total',
            preco_unitario: 95.00,
          },
          {
            nome: 'Perfil U Inferior',
            quantidade_formula: 'largura_total',
            preco_unitario: 95.00,
          },
          {
            nome: 'Perfil Lateral',
            quantidade_formula: 'altura_total * 2',
            preco_unitario: 85.00,
          },
          {
            nome: 'Roldana para Box',
            quantidade_formula: '4',
            preco_unitario: 18.00,
          },
          {
            nome: 'Puxador Inox',
            quantidade_formula: '1',
            preco_unitario: 45.00,
          },
        ],
        
        acessorios_opcionais: [
          {
            nome: 'Pingadeira (Vedação)',
            preco_unitario: 35.00,
          },
        ],
        
        regras_customizadas: {
          folhas_fixas: [1],
          sobreposicao_folhas: 0.08,
        },
      },
      
      mapeamento_materiais: {
        vidro: {
          'incolor': {
            nome: 'Vidro Temperado Incolor',
            hex: '#F5F9FA',
            opacity: 0.2,
          },
          'fume': {
            nome: 'Vidro Temperado Fumê',
            hex: '#9E9E9E',
            opacity: 0.4,
          },
          'verde': {
            nome: 'Vidro Temperado Verde',
            hex: '#C8E6C9',
            opacity: 0.35,
          },
        },
        
        perfil: {
          'branco': {
            nome: 'Alumínio Branco',
            hex: '#FAFAFA',
            acabamento: 'fosco',
          },
          'prata': {
            nome: 'Alumínio Prata',
            hex: '#C0C0C0',
            acabamento: 'anodizado',
          },
          'preto': {
            nome: 'Alumínio Preto',
            hex: '#263238',
            acabamento: 'anodizado',
          },
        },
        
        acessorios: {
          'inox': {
            nome: 'Inox',
            hex: '#DCDCDC',
          },
          'cromado': {
            nome: 'Cromado',
            hex: '#E0E0E0',
          },
        },
      },
      
      metadata: {
        ultima_atualizacao: Timestamp.now(),
        autor: 'Equipe Gestor Vitreo',
        notas: 'Box frontal padrão com 1 folha fixa e 1 móvel de correr.',
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // 5. GUARDA-CORPO TORRE
  // ---------------------------------------------------------------------------
  {
    name: 'Guarda-Corpo Sistema Torre',
    category: 'Guarda-Corpo',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/vidracaria-house.appspot.com/o/templates%2Fguarda-corpo-torre-placeholder.jpg?alt=media',
    active: true,
    tags: ['guarda-corpo', 'torre', 'sacada', 'varanda'],
    createdAt: Timestamp.now(),
    
    engine_config: {
      engine_id: 'guarda_corpo_torre',
      engine_name: 'Guarda-Corpo Sistema Torre',
      engine_version: '1.0.0',
      
      regras_fisicas: {
        tem_pivo: false,
        numero_folhas: 1,
        tipo_movimento: 'fixo',
        
        folgas: {
          padrao: 0,
          lateral: 50,
          superior: 0,
          inferior: 50,
        },
        
        espessuras_vidro_permitidas: [10, 12],
        espessura_vidro_padrao: 10,
        tipos_vidro_permitidos: ['temperado', 'laminado'],
        tipo_perfil: 'torre_inox',
        
        dimensoes_minimas: {
          largura: 0.5,
          altura: 1.05,
        },
        
        dimensoes_maximas: {
          largura: 3.0,
          altura: 1.2,
        },
        
        area_maxima_folha: 3.6,
        peso_maximo_folha: 70,
        
        calcular_folhas_automatico: false,
        
        acessorios_obrigatorios: [
          {
            nome: 'Torre de Fixação Inox',
            quantidade_formula: 'Math.ceil(largura_total / 1.2)',
            preco_unitario: 180.00,
          },
          {
            nome: 'Grampo Fixação Vidro',
            quantidade_formula: 'Math.ceil(largura_total / 1.2) * 2',
            preco_unitario: 35.00,
          },
          {
            nome: 'Corrimão Inox',
            quantidade_formula: 'largura_total',
            preco_unitario: 220.00,
          },
        ],
        
        acessorios_opcionais: [],
        
        regras_customizadas: {
          altura_regulamentada: 1.05,
          espacamento_maximo_torres: 1.2,
        },
      },
      
      mapeamento_materiais: {
        vidro: {
          'incolor': {
            nome: 'Vidro Temperado Incolor',
            hex: '#F5F9FA',
            opacity: 0.15,
          },
          'verde': {
            nome: 'Vidro Temperado Verde',
            hex: '#C8E6C9',
            opacity: 0.3,
          },
          'laminado_incolor': {
            nome: 'Laminado Incolor 10+10',
            hex: '#E3F2FD',
            opacity: 0.2,
          },
        },
        
        perfil: {
          'inox_escovado': {
            nome: 'Inox Escovado',
            hex: '#DCDCDC',
            acabamento: 'fosco',
          },
          'inox_polido': {
            nome: 'Inox Polido',
            hex: '#E8E8E8',
            acabamento: 'brilhante',
          },
        },
        
        acessorios: {
          'inox': {
            nome: 'Inox',
            hex: '#DCDCDC',
          },
        },
      },
      
      metadata: {
        ultima_atualizacao: Timestamp.now(),
        autor: 'Equipe Gestor Vitreo',
        notas: 'Sistema torre para guarda-corpo. Altura mínima 1,05m conforme norma ABNT NBR 14718.',
      },
    },
  },
];

// ============================================================================
// FUNÇÕES
// ============================================================================

async function verificarDuplicados(nome: string): Promise<boolean> {
  const q = query(
    collection(db, 'templates'),
    where('name', '==', nome)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

async function seedTemplates() {
  console.log('🌱 Iniciando seed de templates com configuração de engenharia...\n');
  
  let criados = 0;
  let pulados = 0;
  
  for (const template of TEMPLATES) {
    try {
      // Verifica se já existe
      const existe = await verificarDuplicados(template.name);
      
      if (existe) {
        console.log(`⏭️  Pulando "${template.name}" (já existe)`);
        pulados++;
        continue;
      }
      
      // Cria o template
      const docRef = await addDoc(collection(db, 'templates'), template);
      console.log(`✅ Criado: "${template.name}" (ID: ${docRef.id})`);
      criados++;
      
    } catch (error) {
      console.error(`❌ Erro ao criar "${template.name}":`, error);
    }
  }
  
  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Templates criados: ${criados}`);
  console.log(`   ⏭️  Templates pulados: ${pulados}`);
  console.log(`   📝 Total no seed: ${TEMPLATES.length}`);
  console.log('\n✨ Seed concluído!');
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

seedTemplates()
  .then(() => {
    console.log('\n👋 Encerrando script...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
