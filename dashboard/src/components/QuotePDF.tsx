import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Helper function to ensure image URL is accessible
const getAccessibleImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // If it's already a Firebase Storage URL, ensure it has the correct format
  if (url.includes('firebasestorage.googleapis.com')) {
    // Make sure it has token parameter for public access
    if (!url.includes('alt=media')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}alt=media`;
    }
  }
  
  return url;
};

interface QuoteItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  pricingMethod?: 'm2' | 'linear' | 'fixed' | 'unit';
  dimensions?: {
    width: number;
    height: number;
    area?: number;
  };
  glassColor?: string;
  profileColor?: string;
  isInstallation?: boolean;
  imageUrl?: string;
  description?: string;
}

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  cnpj?: string;
  pdfSettings?: {
    primaryColor: string;
    secondaryColor: string;
    documentTitle: string;
    quoteValidityDays: number;
    customFooterText: string;
    showCnpj: boolean;
    legalTerms: string;
  };
  paymentSettings?: {
    pixDiscount: number;
    maxInstallments: number;
    paymentNotes: string;
  };
}

interface QuotePDFProps {
  clientName: string;
  clientAddress: string;
  clientCondominium: string;
  clientPhone: string;
  clientEmail: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  quoteNumber?: string;
  createdAt?: Date;
  warranty?: string;
  observations?: string;
  companyData?: CompanyData;
  photos?: string[];
  hasRisk?: boolean;
  hideDimensions?: boolean;
  hideUnitPrice?: boolean;
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
    alignItems: 'center', // CENTRALIZAR LOGO
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 15,
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
  clientLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  clientValue: {
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
    alignItems: 'flex-start',
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
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 10,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E2E8F0',
    fontSize: 8,
    color: '#64748B',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  footerText: {
    marginBottom: 5,
    lineHeight: 1.5,
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
  validity: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    fontSize: 9,
    color: '#92400E',
    textAlign: 'center',
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

export function QuotePDF({
  clientName,
  clientAddress,
  clientCondominium,
  clientPhone,
  clientEmail,
  items,
  subtotal,
  discount,
  total,
  quoteNumber,
  createdAt,
  warranty,
  observations,
  companyData,
  photos = [],
  hasRisk = false,
  hideDimensions = false,
  hideUnitPrice = false,
}: QuotePDFProps) {
  // Fallback to default values if companyData is not provided
  const company = companyData || {
    name: 'House Manutenção',
    address: 'Rua Rio Grande do Norte, 726, Savassi',
    phone: '(31) 98279-8513',
    email: 'contato@housemanutencao.com.br',
    cnpj: '42.721.809/0001-52',
  };
  
  // Get PDF settings with defaults
  const pdfSettings = company.pdfSettings || {
    primaryColor: '#0F172A',
    secondaryColor: '#2563EB',
    documentTitle: 'ORÇAMENTO DE SERVIÇOS',
    quoteValidityDays: 15,
    customFooterText: '',
    showCnpj: true,
    legalTerms: '',
  };
  
  // Get payment settings with defaults
  const paymentSettings = company.paymentSettings || {
    pixDiscount: 5,
    maxInstallments: 3,
    paymentNotes: '',
  };
  
  // Debug: Log items with imageUrl
  console.log('📄 QuotePDF received items:', items);
  items.forEach((item, index) => {
    console.log(`PDF Item ${index}:`, {
      serviceName: item.serviceName,
      imageUrl: item.imageUrl,
      hasImageUrl: !!item.imageUrl,
    });
  });
  
  // Dynamic styles based on pdfSettings
  const dynamicStyles = StyleSheet.create({
    header: {
      marginBottom: 30,
      borderBottom: `2 solid ${pdfSettings.primaryColor}`,
      paddingBottom: 15,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#0F172A', // SEMPRE PRETO, não muda conforme empresa
      marginTop: 20,
      marginBottom: 15,
      textAlign: 'center', // CENTRALIZADO
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: pdfSettings.primaryColor,
      color: '#FFFFFF',
      padding: 10,
      fontWeight: 'bold',
      fontSize: 9,
    },
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) {
      const now = new Date();
      return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <View style={styles.logoContainer}>
            {company.logoUrl ? (
            <Image
                src={company.logoUrl}
              style={{ width: 80, height: 80, marginBottom: 10 }}
            />
            ) : null}
            {!company.logoUrl && <Text style={styles.companyName}>{company.name}</Text>}
          </View>
          <Text style={styles.companyInfo}>
            {company.address}{'\n'}
            Telefone: {company.phone}{'\n'}
            {company.email && `Email: ${company.email}`}
            {pdfSettings.showCnpj && company.cnpj && `\nCNPJ: ${company.cnpj}`}
          </Text>
        </View>

        {/* Title */}
        <Text style={dynamicStyles.title}>{pdfSettings.documentTitle}</Text>

        {/* Quote Info */}
        {quoteNumber && (
          <View style={styles.section}>
            <Text style={styles.clientLabel}>Número do Orçamento:</Text>
            <Text style={styles.clientValue}>{quoteNumber}</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.clientLabel}>Data de Emissão:</Text>
          <Text style={styles.clientValue}>{formatDate(createdAt)}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientLabel}>CLIENTE:</Text>
          <Text style={styles.clientValue}>{clientName}</Text>
          <Text style={styles.clientLabel}>CONDOMÍNIO:</Text>
          <Text style={styles.clientValue}>{clientCondominium}</Text>
          <Text style={styles.clientLabel}>ENDEREÇO:</Text>
          <Text style={styles.clientValue}>{clientAddress}</Text>
          <Text style={styles.clientLabel}>TELEFONE:</Text>
          <Text style={styles.clientValue}>{clientPhone}</Text>
          <Text style={styles.clientLabel}>EMAIL:</Text>
          <Text style={styles.clientValue}>{clientEmail}</Text>
        </View>

        {/* Services Table */}
        <View style={styles.table}>
          <View style={dynamicStyles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>MODELO</Text>
            <Text style={[styles.tableCell, { flex: 2.5 }]}>DESCRIÇÃO/DETALHES</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>MEDIDAS</Text>
            <Text style={styles.tableCellCenter}>QTD</Text>
            {!hideUnitPrice && (
            <Text style={styles.tableCellRight}>PREÇO UNIT.</Text>
            )}
            <Text style={styles.tableCellRight}>TOTAL</Text>
          </View>
          {items.map((item, index) => {
            // Build service description
            let serviceDescription = item.serviceName;
            
            // Adiciona ÁREA TOTAL (m²) na descrição
            if (item.isInstallation && item.pricingMethod === 'm2' && item.dimensions && !hideDimensions) {
              const totalArea = (item.dimensions.area || (item.dimensions.width * item.dimensions.height / 1000000)) * item.quantity;
              serviceDescription += `\n${totalArea.toFixed(2)} m²`;
            }
            
            // Adiciona informações de cores se disponíveis
            if (item.isInstallation && (item.glassColor || item.profileColor)) {
              const colorInfo = [];
              if (item.glassColor) colorInfo.push(`Vidro: ${item.glassColor}`);
              if (item.profileColor) colorInfo.push(`Perfil: ${item.profileColor}`);
              if (colorInfo.length > 0) {
                serviceDescription += `\n${colorInfo.join(' | ')}`;
              }
            }

            // Build dimensions text - LARGURA x ALTURA (original)
            let dimensionsText = '';
            if (item.isInstallation && item.pricingMethod === 'm2' && item.dimensions && !hideDimensions) {
              // Mostra as medidas originais (largura x altura)
              const widthM = (item.dimensions.width / 1000).toFixed(2);
              const heightM = (item.dimensions.height / 1000).toFixed(2);
              dimensionsText = `Largura: ${widthM}m\nAltura: ${heightM}m`;
            } else if (item.isInstallation && item.pricingMethod === 'linear' && item.dimensions && !hideDimensions) {
              const widthM = (item.dimensions.width / 1000).toFixed(2);
              dimensionsText = `Largura: ${widthM}m`;
            }

            return (
              <View key={index} style={[styles.tableRow, { minHeight: item.imageUrl ? 80 : 40 }]}>
                {/* Image Column */}
                <View style={[styles.tableCell, { flex: 1.5, paddingRight: 5 }]}>
                  {item.imageUrl ? (
                    <Image
                      src={getAccessibleImageUrl(item.imageUrl) || ''}
                      cache={false}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <View style={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#E2E8F0',
                      borderRadius: 4,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 8, color: '#94A3B8' }}>Sem imagem</Text>
                    </View>
                  )}
                </View>
                
                {/* Description Column */}
                <View style={[styles.tableCell, { flex: 2.5, paddingRight: 5 }]}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{item.serviceName}</Text>
                  {item.description && (
                    <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 2 }}>{item.description}</Text>
                  )}
                  {!item.description && serviceDescription !== item.serviceName && (
                    <Text style={{ fontSize: 9 }}>{serviceDescription.replace(item.serviceName, '').trim()}</Text>
                  )}
                </View>
                
                {/* Dimensions Column */}
                <View style={[styles.tableCell, { flex: 1, paddingRight: 5 }]}>
                  {dimensionsText ? (
                    <Text style={{ fontSize: 8 }}>{dimensionsText}</Text>
                  ) : (
                    <Text style={{ fontSize: 8, color: '#94A3B8' }}>-</Text>
                  )}
                </View>
                
                {/* Quantity Column */}
                <Text style={styles.tableCellCenter}>{item.quantity}</Text>
                
                {/* Unit Price Column */}
                {!hideUnitPrice && (
                <Text style={styles.tableCellRight}>
                  {item.pricingMethod === 'fixed' ? '-' : formatCurrency(item.unitPrice)}
                </Text>
                )}
                
                {/* Total Column */}
                <Text style={styles.tableCellRight}>{formatCurrency(item.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text>Desconto:</Text>
              <Text>- {formatCurrency(discount)}</Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text>TOTAL:</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Warranty */}
        {warranty && (
          <View style={styles.validity}>
            <Text style={{ fontWeight: 'bold' }}>GARANTIA: {warranty.toUpperCase()}</Text>
          </View>
        )}

        {/* Validity */}
        <View style={styles.validity}>
          <Text style={{ fontWeight: 'bold' }}>VALIDADE: {pdfSettings.quoteValidityDays} DIAS</Text>
        </View>

        {/* Observations */}
        {observations && (
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>OBSERVAÇÕES:</Text>
            <Text style={styles.footerText}>{observations}</Text>
          </View>
        )}

        {/* Payment Terms */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>CONDIÇÕES DE PAGAMENTO:</Text>
          <Text style={styles.footerText}>
            {paymentSettings.pixDiscount > 0 && `• Pix: Desconto de ${paymentSettings.pixDiscount}% no pagamento à vista${'\n'}`}
            {paymentSettings.maxInstallments > 1 && `• Cartão de Crédito: Parcelamento em até ${paymentSettings.maxInstallments}x sem juros${'\n'}`}
            {paymentSettings.paymentNotes && `${paymentSettings.paymentNotes}`}
          </Text>
        </View>

        {/* Legal Text */}
        {pdfSettings.legalTerms && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {pdfSettings.legalTerms}
            </Text>
          </View>
        )}

        {/* Custom Footer Text */}
        {pdfSettings.customFooterText && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
              {pdfSettings.customFooterText}
          </Text>
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
        {pdfSettings.showCnpj && company.cnpj && (
        <View style={styles.companySignature}>
          <Text style={styles.cnpjText}>
              {company.name} - CNPJ: {company.cnpj}
          </Text>
        </View>
        )}
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

