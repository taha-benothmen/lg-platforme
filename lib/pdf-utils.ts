export const generateDevisPDFContent = (devisData: any, isFromCreation: boolean = false) => {
    const {
      id,
      clientName,
      clientEmail,
      clientPhone = "",
      clientAddr = "",
      clientEnterprise = "",
      clientNotes = "",
      total,
      paymentPeriod = null,
      monthlyPayment = null,
      createdAt,
      updatedAt,
      items = [],
      itemsCount = 0,
      createdBy = null,
      etablissement = null,
    } = devisData
  
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("fr-FR")
    }
  
    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString("fr-FR")
    }
  
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Devis</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f5f5;
        color: #333;
        line-height: 1.6;
      }
      
      .container {
        max-width: 900px;
        margin: 0 auto;
        background-color: white;
        padding: 40px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 3px solid #007bff;
      }
      
      .header-left h1 {
        font-size: 32px;
        color: #007bff;
        margin-bottom: 5px;
      }
      
      .header-left p {
        color: #666;
        font-size: 14px;
      }
      
      .header-right {
        text-align: right;
      }
      
      .header-right p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .header-right strong {
        color: #007bff;
      }
      
      .section {
        margin-bottom: 35px;
      }
      
      .section-title {
        font-size: 13px;
        font-weight: bold;
        color: #007bff;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e0e0e0;
      }
      
      .info-row {
        display: flex;
        margin-bottom: 10px;
      }
      
      .info-label {
        font-weight: bold;
        color: #007bff;
        min-width: 150px;
        font-size: 13px;
      }
      
      .info-value {
        color: #555;
        font-size: 13px;
      }
      
      .products-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 13px;
      }
      
      .products-table th {
        background-color: #007bff;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: bold;
      }
      
      .products-table td {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .products-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      .text-right {
        text-align: right;
      }
      
      .total-section {
        text-align: right;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 3px solid #007bff;
      }
      
      .total-row {
        font-size: 18px;
        font-weight: bold;
        color: #007bff;
        margin: 10px 0;
      }
  
      .payment-plan-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin: 15px 0;
      }
  
      .payment-plan-table th {
        background-color: #e8f4f8;
        color: #007bff;
        padding: 10px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #007bff;
      }
  
      .payment-plan-table td {
        padding: 10px;
        border: 1px solid #ddd;
      }
  
      .payment-plan-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
  
      .notes-section {
        margin-top: 30px;
        padding: 15px;
        background-color: #f9f9f9;
        border-left: 4px solid #ffc107;
        border-radius: 4px;
        font-size: 12px;
      }
  
      .notes-title {
        font-weight: bold;
        color: #ffc107;
        margin-bottom: 10px;
      }
      
      .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 11px;
        color: #999;
        border-top: 1px solid #e0e0e0;
        padding-top: 20px;
      }
      
      @media print {
        body {
          background-color: white;
        }
        .container {
          box-shadow: none;
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="header-left">
          <h1>DEVIS</h1>
          <p>Référence: <strong>${id.slice(0, 8)}</strong></p>
        </div>
        <div class="header-right">
          <p><strong>Date de création:</strong> ${formatDate(createdAt)}</p>
          ${updatedAt ? `<p><strong>Dernière mise à jour:</strong> ${formatDate(updatedAt)}</p>` : ''}
        </div>
      </div>
  
      <!-- ÉTABLISSEMENT -->
      ${etablissement ? `
      <div class="section">
        <div class="section-title">Établissement</div>
        <div class="info-row">
          <span class="info-label">Nom:</span>
          <span class="info-value">Sodig</span>
        </div>
        ${etablissement.address ? `
        <div class="info-row">
          <span class="info-label">Adresse:</span>
          <span class="info-value">Tunis-</span>
        </div>
        ` : ''}
        ${etablissement.phone ? `
        <div class="info-row">
          <span class="info-label">Téléphone:</span>
          <span class="info-value">${etablissement.phone}</span>
        </div>
        ` : ''}
        ${etablissement.email ? `
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${etablissement.email}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}
  
      <!-- RESPONSABLE -->
      ${createdBy ? `
      <div class="section">
        <div class="section-title">👤 Responsable</div>
        <div class="info-row">
          <span class="info-label">Nom:</span>
          <span class="info-value">${createdBy.firstName} ${createdBy.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${createdBy.email}</span>
        </div>
      </div>
      ` : ''}
  
      <!-- CLIENT -->
      <div class="section">
        <div class="section-title">👥 Informations du Client</div>
        <div class="info-row">
          <span class="info-label">Nom:</span>
          <span class="info-value">${clientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${clientEmail}</span>
        </div>
        ${clientPhone ? `
        <div class="info-row">
          <span class="info-label">Téléphone:</span>
          <span class="info-value">${clientPhone}</span>
        </div>
        ` : ''}
        ${clientEnterprise ? `
        <div class="info-row">
          <span class="info-label">Entreprise:</span>
          <span class="info-value">${clientEnterprise}</span>
        </div>
        ` : ''}
        ${clientAddr ? `
        <div class="info-row">
          <span class="info-label">Adresse:</span>
          <span class="info-value">${clientAddr}</span>
        </div>
        ` : ''}
      </div>
  
      <!-- PRODUITS -->
      <div class="section">
        <div class="section-title">Produits (${itemsCount})</div>
        ${items && items.length > 0 ? `
        <table class="products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th style="width: 80px;">Quantité</th>
              <th style="width: 120px;">Prix Unitaire</th>
              <th class="text-right" style="width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
            <tr>
              <td>${item.product?.name || 'Produit'}</td>
              <td>${item.quantity}</td>
              <td class="text-right">${parseFloat(item.price).toFixed(2)} TND</td>
              <td class="text-right"><strong>${(parseFloat(item.price) * item.quantity).toFixed(2)} TND</strong></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p style="color: #999; font-style: italic;">Aucun produit</p>'}
      </div>
  
      <!-- TOTAL -->
      <div class="total-section">
        <div class="total-row">
          TOTAL: ${parseFloat(total).toFixed(2)} TND
        </div>
      </div>
  
      <!-- PLAN DE PAIEMENT ÉCHELONNÉ -->
      ${paymentPeriod && paymentPeriod > 0 ? `
      <div class="section">
        <div class="section-title">Plan de paiement échelonné</div>
        <table class="payment-plan-table">
          <thead>
            <tr>
              <th>Durée</th>
              <th class="text-right">Mensualité</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${paymentPeriod} mois</td>
              <td class="text-right"><strong>${monthlyPayment?.toFixed(2) || (parseFloat(total) / paymentPeriod).toFixed(2)} TND/mois</strong></td>
              <td class="text-right"><strong>${parseFloat(total).toFixed(2)} TND</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}
  
      <!-- NOTES -->
      ${clientNotes ? `
      <div class="notes-section">
        <div class="notes-title">Notes</div>
        <p>${clientNotes.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
  
      <!-- FOOTER -->
      <div class="footer">
        <p>Ce devis a été généré le ${formatDate(createdAt)} à ${formatTime(createdAt)}</p>
        <p>Document confidentiel - Réservé aux parties autorisées</p>
      </div>
    </div>
  </body>
  </html>
    `
  }