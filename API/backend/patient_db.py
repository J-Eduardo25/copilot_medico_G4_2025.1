import json
import os
import uuid
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), 'patients_db.json')

def load_database():
    """Carrega o banco de dados JSON do arquivo."""
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError):
        return {} # Retorna um dicionário vazio em caso de erro ou arquivo vazio

def save_database(db_data):
    """Salva o banco de dados JSON no arquivo."""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(db_data, f, ensure_ascii=False, indent=2)
    except IOError:
        print(f"Erro: Não foi possível salvar o banco de dados em {DB_FILE}")

def generate_patient_id():
    """Gera um ID de paciente único (UUID)."""
    return str(uuid.uuid4())

def get_patient_data(patient_id):
    """Recupera os dados de um paciente específico."""
    db = load_database()
    return db.get(patient_id)

def ensure_patient_exists(patient_id, name=None):
    """
    Garante que um paciente exista no banco de dados.
    Se não existir, cria uma nova entrada e retorna os dados dos pacientes
    """
    db = load_database()
    if patient_id not in db:
        db[patient_id] = {
            "name": name if name else "Desconhecido", # Nome opcional
            "chat_history": [] # Histórico no formato para Gemini
        }
        save_database(db)
    elif name and db[patient_id].get("name", "Desconhecido") == "Desconhecido":
        # Atualiza o nome se um novo nome for fornecido e o atual for "Desconhecido"
        db[patient_id]["name"] = name
        save_database(db)
    return db[patient_id]

def get_patient_chat_history(patient_id):
    """Recupera o histórico de chat de um paciente formatado para o Gemini."""
    patient_data = get_patient_data(patient_id)
    if patient_data:
        return patient_data.get("chat_history", [])
    return []

def add_message_to_history(patient_id: str, role: str, text: str):
    """
    Adiciona uma mensagem ao histórico do paciente.
    'role' pode ser 'user' ou 'model'.
    """
    db = load_database()
    if patient_id not in db:
        # Isso garante que o paciente exista, mesmo que algo tenha dado errado antes.
        print(f"Aviso: Paciente {patient_id} não encontrado ao adicionar mensagem. Criando entrada.")
        ensure_patient_exists(patient_id) 
        db = load_database() # Recarrega após possível criação

    # Para uma parte de texto simples, a API Gemini espera um dicionário apenas com a chave 'text'.
    # A lista 'parts' pode conter múltiplos desses dicionários se a mensagem tiver várias partes.
    message_parts_for_gemini = [{'text': text}]

    if patient_id in db and "chat_history" in db[patient_id]:
        db[patient_id]["chat_history"].append({
            "role": role,
            "parts": message_parts_for_gemini, #estrutura corrigida para 'parts'
            "timestamp": datetime.now().isoformat() 
        })
    else:
        # Caso extremamente raro onde ensure_patient_exists falhou em criar a estrutura completa
        print(f"Erro crítico: Estrutura do paciente {patient_id} não encontrada ou incompleta no DB.")
        # Por segurança, recriar a estrutura:
        db[patient_id] = db.get(patient_id, {}) # Garante que patient_id existe como chave
        db[patient_id]["name"] = db[patient_id].get("name", "Desconhecido")
        db[patient_id]["chat_history"] = [{
            "role": role,
            "parts": message_parts_for_gemini,
            "timestamp": datetime.now().isoformat()
        }]

    save_database(db)