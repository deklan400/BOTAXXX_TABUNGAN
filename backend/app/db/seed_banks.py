"""
Seeder untuk master data bank
Jalankan script ini untuk populate database dengan data bank Indonesia dan bank luar
"""
from sqlalchemy.orm import Session
from app.models.bank import Bank
from app.db.session import SessionLocal


def seed_banks():
    """Seed master data banks"""
    db: Session = SessionLocal()
    
    try:
        # Check if banks already exist
        existing_bank = db.query(Bank).first()
        if existing_bank:
            print("Banks already seeded. Skipping...")
            return
        
        banks_data = [
            # Bank Indonesia - Major Banks
            {"name": "BCA", "code": "bca", "logo_filename": "bca.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank Mandiri", "code": "mandiri", "logo_filename": "mandiri.png", "brand_color": "#E31837", "country": "ID"},
            {"name": "BNI", "code": "bni", "logo_filename": "bni.png", "brand_color": "#FDB913", "country": "ID"},
            {"name": "BRI", "code": "bri", "logo_filename": "bri.png", "brand_color": "#006B3C", "country": "ID"},
            {"name": "CIMB Niaga", "code": "cimb", "logo_filename": "cimb.png", "brand_color": "#E20074", "country": "ID"},
            {"name": "Bank Danamon", "code": "danamon", "logo_filename": "danamon.png", "brand_color": "#003087", "country": "ID"},
            {"name": "Permata Bank", "code": "permata", "logo_filename": "permata.png", "brand_color": "#6B2C91", "country": "ID"},
            {"name": "Maybank Indonesia", "code": "maybank", "logo_filename": "maybank.png", "brand_color": "#FFCD00", "country": "ID"},
            {"name": "OCBC NISP", "code": "ocbc", "logo_filename": "ocbc.png", "brand_color": "#E4002B", "country": "ID"},
            {"name": "Bank Mega", "code": "mega", "logo_filename": "mega.png", "brand_color": "#003366", "country": "ID"},
            {"name": "BTPN/Jenius", "code": "btpn", "logo_filename": "btpn.png", "brand_color": "#00A859", "country": "ID"},
            {"name": "Bank Jago", "code": "jago", "logo_filename": "jago.png", "brand_color": "#00D9FF", "country": "ID"},
            {"name": "Bank Neo Commerce", "code": "neo", "logo_filename": "neo.png", "brand_color": "#0066FF", "country": "ID"},
            {"name": "Bank Syariah Indonesia", "code": "bsi", "logo_filename": "bsi.png", "brand_color": "#00A651", "country": "ID"},
            {"name": "Bank Muamalat", "code": "muamalat", "logo_filename": "muamalat.png", "brand_color": "#009639", "country": "ID"},
            {"name": "Bank Bukopin", "code": "bukopin", "logo_filename": "bukopin.png", "brand_color": "#003366", "country": "ID"},
            {"name": "Bank Tabungan Negara", "code": "btn", "logo_filename": "btn.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank DKI", "code": "dki", "logo_filename": "dki.png", "brand_color": "#003366", "country": "ID"},
            
            # Bank BPD (Bank Pembangunan Daerah)
            {"name": "Bank BPD Jawa Timur", "code": "bpd-jatim", "logo_filename": "bpd-jatim.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Jawa Tengah", "code": "bpd-jateng", "logo_filename": "bpd-jateng.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Sulawesi Selatan", "code": "bpd-sulsel", "logo_filename": "bpd-sulsel.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Sumatera Utara", "code": "bpd-sumut", "logo_filename": "bpd-sumut.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Kalimantan Barat", "code": "bpd-kalbar", "logo_filename": "bpd-kalbar.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Kalimantan Timur", "code": "bpd-kaltim", "logo_filename": "bpd-kaltim.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Bali", "code": "bpd-bali", "logo_filename": "bpd-bali.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Sumatera Barat", "code": "bpd-sumbar", "logo_filename": "bpd-sumbar.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Sumatera Selatan", "code": "bpd-sumsel", "logo_filename": "bpd-sumsel.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Riau", "code": "bpd-riau", "logo_filename": "bpd-riau.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Kepulauan Riau", "code": "bpd-kepri", "logo_filename": "bpd-kepri.png", "brand_color": "#0066CC", "country": "ID"},
            {"name": "Bank BPD Lainnya", "code": "bpd-lainnya", "logo_filename": "bpd-lainnya.png", "brand_color": "#0066CC", "country": "ID"},
            
            # Bank Luar Negeri
            {"name": "ABA Bank", "code": "aba", "logo_filename": "aba.png", "brand_color": "#FF6600", "country": "KH"},
            {"name": "DBS Bank", "code": "dbs", "logo_filename": "dbs.png", "brand_color": "#DB0000", "country": "SG"},
            {"name": "HSBC", "code": "hsbc", "logo_filename": "hsbc.png", "brand_color": "#DB0019", "country": "HK"},
            {"name": "Citibank", "code": "citibank", "logo_filename": "citibank.png", "brand_color": "#0066CC", "country": "US"},
            {"name": "Standard Chartered", "code": "standard-chartered", "logo_filename": "standard-chartered.png", "brand_color": "#00A651", "country": "GB"},
            {"name": "UOB", "code": "uob", "logo_filename": "uob.png", "brand_color": "#00A859", "country": "SG"},
            {"name": "Bank Luar Lainnya", "code": "bank-luar-lainnya", "logo_filename": "bank-luar-lainnya.png", "brand_color": "#666666", "country": "XX"},
        ]
        
        for bank_data in banks_data:
            bank = Bank(**bank_data)
            db.add(bank)
        
        db.commit()
        print(f"Successfully seeded {len(banks_data)} banks")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding banks: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_banks()

