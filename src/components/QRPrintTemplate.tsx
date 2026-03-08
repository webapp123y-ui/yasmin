import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Student } from '../types';

interface QRPrintTemplateProps {
  students: Student[];
}

export default function QRPrintTemplate({ students }: QRPrintTemplateProps) {
  return (
    <div 
      id="qr-print-template" 
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        direction: 'rtl',
        backgroundColor: '#ffffff',
        padding: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '30px',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      {students.map((student) => (
        <div 
          key={student.id} 
          style={{ 
            height: '60mm',
            border: '1px solid #f5f5f4',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '15px'
          }}
        >
          <div 
            style={{ 
              border: '1px solid #e7e5e4',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '8px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QRCodeSVG 
              value={`${window.location.origin}?studentId=${student.id}`} 
              size={120} 
              level="H"
              includeMargin={false}
            />
          </div>
          <p 
            style={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '2px',
              marginTop: '0px',
              color: '#1c1917',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {student.name}
          </p>
          <p 
            style={{ 
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#059669',
              marginBottom: '4px',
              marginTop: '0px'
            }}
          >
            S:{student.id.toUpperCase()} {student.class_id ? `| C:${student.class_id.toUpperCase()}` : ''}
          </p>
          <p 
            style={{ 
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#78716c',
              margin: '0px'
            }}
          >
            {student.class_name}
          </p>
        </div>
      ))}
    </div>
  );
}
