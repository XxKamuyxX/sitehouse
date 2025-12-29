import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface ReceiptItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ChecklistItem {
  task: string;
  completed: boolean;
}

interface ReceiptPDFProps {
  clientName: string;
  workOrderId: string;
  scheduledDate: string;
  scheduledTime?: string;
  completedDate: string;
  technician: string;
  checklist: ChecklistItem[];
  notes: string;
  items: ReceiptItem[];
  total: number;
  warranty: string;
  photos?: string[];
  hasRisk?: boolean;
  cnpj?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #0F172A',
    paddingBottom: 15,
  },
  logoContainer: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  clientInfo: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #E2E8F0',
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellCenter: {
    flex: 1,
    textAlign: 'center',
  },
  checklist: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
  },
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 5,
    fontSize: 9,
  },
  checklistCompleted: {
    textDecoration: 'line-through',
    color: '#64748B',
  },
  total: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warranty: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    fontSize: 9,
    color: '#92400E',
    textAlign: 'center',
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    fontSize: 9,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  signature: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
  },
  signatureLine: {
    borderTop: '1 solid #0F172A',
    width: 300,
    marginTop: 50,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 9,
    color: '#64748B',
  },
  photoSection: {
    marginTop: 30,
    pageBreak: 'before',
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  photoContainer: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 15,
  },
  photoImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    marginBottom: 5,
  },
  photoCaption: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  riskWarning: {
    backgroundColor: '#FEE2E2',
    border: '2 solid #DC2626',
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  riskWarningText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: 'bold',
    lineHeight: 1.5,
  },
  companySignature: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
    alignItems: 'center',
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 10,
  },
  cnpjText: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 5,
  },
});

export function ReceiptPDF({
  clientName,
  workOrderId,
  scheduledDate,
  scheduledTime,
  completedDate,
  technician,
  checklist,
  notes,
  items,
  total,
  warranty,
  photos = [],
  hasRisk = false,
  cnpj = '00.000.000/0001-00',
}: ReceiptPDFProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string, time?: string) => {
    const date = new Date(dateString).toLocaleDateString('pt-BR');
    return time ? `${date} às ${time}` : date;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              src="/logo.png"
              style={{ width: 80, height: 80, marginBottom: 10 }}
            />
            <Text style={styles.companyName}>House Manutenção</Text>
          </View>
          <Text style={styles.companyInfo}>
            Rua Rio Grande do Norte, 726, Savassi{'\n'}
            Belo Horizonte - MG{'\n'}
            Telefone: (31) 98279-8513{'\n'}
            Email: contato@housemanutencao.com.br
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>RECIBO DE SERVIÇO PRESTADO</Text>

        {/* Work Order Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Número da OS:</Text>
          <Text style={styles.value}>{workOrderId}</Text>
          <Text style={styles.label}>Data de Agendamento:</Text>
          <Text style={styles.value}>{formatDateTime(scheduledDate, scheduledTime)}</Text>
          <Text style={styles.label}>Data de Conclusão:</Text>
          <Text style={styles.value}>{formatDate(completedDate)}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.label}>CLIENTE:</Text>
          <Text style={styles.value}>{clientName}</Text>
          <Text style={styles.label}>TÉCNICO RESPONSÁVEL:</Text>
          <Text style={styles.value}>{technician || 'Não informado'}</Text>
        </View>

        {/* Services Table */}
        {items.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 3 }]}>SERVIÇO REALIZADO</Text>
              <Text style={styles.tableCellCenter}>QTD</Text>
              <Text style={styles.tableCellRight}>VALOR UNIT.</Text>
              <Text style={styles.tableCellRight}>TOTAL</Text>
            </View>
            {items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.serviceName}</Text>
                <Text style={styles.tableCellCenter}>{item.quantity}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Checklist */}
        {checklist && checklist.length > 0 && (
          <View style={styles.checklist}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 10, color: '#0F172A' }}>
              CHECKLIST DE SERVIÇOS:
            </Text>
            {checklist.map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <Text style={{ marginRight: 5 }}>{item.completed ? '✓' : '○'}</Text>
                <Text style={item.completed ? styles.checklistCompleted : {}}>
                  {item.task}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Total */}
        <View style={styles.total}>
          <Text>TOTAL RECEBIDO:</Text>
          <Text>{formatCurrency(total)}</Text>
        </View>

        {/* Warranty */}
        <View style={styles.warranty}>
          <Text style={{ fontWeight: 'bold' }}>GARANTIA: {warranty.toUpperCase()}</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>OBSERVAÇÕES TÉCNICAS:</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* Risk Warning */}
        {hasRisk && (
          <View style={styles.riskWarning}>
            <Text style={styles.riskWarningText}>
              ⚠️ ATENÇÃO: Identificamos fadiga no sistema (vidros descolados/ressecados). 
              A empresa não se responsabiliza por quebras decorrentes do manuseio de peças já comprometidas estruturalmente.
            </Text>
          </View>
        )}

        {/* Legal Text */}
        <View style={styles.footer}>
          <Text>
            Serviço realizado conforme normas técnicas. Garantia de {warranty} em todos os serviços executados.
            {'\n\n'}
            Este recibo comprova a prestação de serviço e o recebimento do valor acima mencionado.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{clientName}</Text>
          <Text style={styles.signatureText}>
            {hasRisk 
              ? 'Declaro ciência do risco preexistente e autorizo o serviço, isentando a contratada de responsabilidade sobre quebras de vidros já danificados.'
              : 'Cliente'}
          </Text>
        </View>

        {/* Company Signature & CNPJ */}
        <View style={styles.companySignature}>
          <Image
            src="/signature.png"
            style={styles.signatureImage}
          />
          <Text style={styles.cnpjText}>
            House Manutenção - CNPJ: {cnpj}
          </Text>
        </View>
      </Page>

      {/* Photo Report Page */}
      {photos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.photoSection}>
            <Text style={styles.photoTitle}>RELATÓRIO DE VISTORIA - FOTOS DO SERVIÇO</Text>
            <View style={styles.photoGrid}>
              {photos.map((photoUrl, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image
                    src={photoUrl}
                    style={styles.photoImage}
                  />
                  <Text style={styles.photoCaption}>Foto {index + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}

