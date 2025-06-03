import sys
import os
import json
import uuid # Para gerar IDs

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend import gemini_connection
from backend import pdf_reader
from backend import text_filter
from backend import patient_db # Importar o novo módulo

app = Flask(__name__)
CORS(app)

# LEITURA DE DADOS AMPLIMED (PRONTUÁRIO NO BROWSER) NÃO ESTÁ FUNCIONANDO, MAS FOI ADICIONADA UMA IMPLEMENTAÇÃO INICIAL PARA FILTRAGEM DE DADOS:
@app.route('/api/extracted-data', methods=['POST'])
def receive_extracted_data():
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "Nenhum dado recebido"}), 400

        patient_id = data.get('patient_id')
        new_patient_id_generated = None

        if not patient_id:
            patient_id = patient_db.generate_patient_id()
            new_patient_id_generated = patient_id # Sinaliza para retornar ao frontend
        
        patient_db.ensure_patient_exists(patient_id)

        formatted_patient_data = "Dados do paciente extraídos da página:\n"
        if isinstance(data.get('extracted_content'), list): # Supondo que os dados extraídos estejam em 'extracted_content'
             for item in data['extracted_content']:
                  if isinstance(item, dict) and 'role' in item and 'text' in item:
                       formatted_patient_data += f"{item['role']}: {item['text']}\n"
                  else:
                       print(f"Item de dado ignorado por formato inválido: {item}")
        else:
             formatted_patient_data += str(data.get('extracted_content', ''))

        # Opcional: Remover nomes dos dados formatados antes de enviar para IA ou salvar
        # formatted_patient_data_filtered = text_filter.remover_nomes(formatted_patient_data)

        print(f"\nEnviando dados extraídos para Gemini (Paciente: {patient_id}):\n{formatted_patient_data}")
        
        # Adicionar os dados extraídos como uma mensagem ao histórico
        # considerar como uma entrada do "usuário" para fins de fluxo de conversação
        patient_db.add_message_to_history(patient_id, "user", f"Dados extraídos da página: {formatted_patient_data}")
        
        ai_response = gemini_connection.send_message(patient_id, formatted_patient_data)
        patient_db.add_message_to_history(patient_id, "model", ai_response)

        response_data = {
            "status": "success",
            "message": "Dados processados com sucesso pela IA Gemini",
            "ai_response": ai_response
        }
        if new_patient_id_generated:
            response_data["patient_id"] = new_patient_id_generated
            
        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Erro interno do servidor: {e}"}), 500

# ENDPOINT DO CHAT
@app.route('/api/chat', methods=['POST'])
def handle_chat_message():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({"status": "error", "message": "Requisição inválida."}), 400

        user_message = data['message']
        patient_id = data.get('patient_id')
        user_provided_name_for_id = data.get('patient_name_for_id') # pra se o front enviar um nome para associar ao novo ID

        new_patient_id_generated = None

        if not patient_id:
            patient_id = patient_db.generate_patient_id()
            new_patient_id_generated = patient_id
            # Se um nome foi fornecido para um novo ID, use-o
            patient_db.ensure_patient_exists(patient_id, name=user_provided_name_for_id)
        else:
            patient_db.ensure_patient_exists(patient_id) # Garante que existe, pode atualizar nome se necessário

        print(f"\nMensagem recebida para Paciente ID {patient_id}: {user_message}")

        filtered_user_message = text_filter.remover_nomes(user_message)
        patient_db.add_message_to_history(patient_id, "user", filtered_user_message if filtered_user_message else user_message) # Salva filtrado ou original

        ai_response_text = gemini_connection.send_message(patient_id, filtered_user_message)
        patient_db.add_message_to_history(patient_id, "model", ai_response_text)
        
        response_data = {
            "status": "success",
            "ai_response": ai_response_text
        }
        if new_patient_id_generated:
            response_data["patient_id"] = new_patient_id_generated

        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Erro interno do servidor: {e}"}), 500

# ENDPOINT DOS ARQUIVOS PDF
@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({"status": "error", "message": "Nenhum arquivo enviado."}), 400

        file = request.files['pdf']
        # patient_id pode vir de 'request.form' se enviado como campo de formulário junto com o arquivo
        patient_id = request.form.get('patient_id') 
        user_provided_name_for_id = request.form.get('patient_name_for_id')

        new_patient_id_generated = None

        if not patient_id:
            patient_id = patient_db.generate_patient_id()
            new_patient_id_generated = patient_id
            patient_db.ensure_patient_exists(patient_id, name=user_provided_name_for_id)
        else:
            patient_db.ensure_patient_exists(patient_id)

        extracted_text = pdf_reader.extract_text_from_pdf(file)
        if not extracted_text.strip():
            return jsonify({"status": "error", "message": "Texto extraído está vazio."}), 400

        filtered_extracted_text = text_filter.remover_nomes(extracted_text)
        
        # Adicionar o texto extraído como uma mensagem ao histórico
        context_message_for_pdf = f"O seguinte texto foi extraído de um PDF enviado pelo usuário: \"{filtered_extracted_text}\". Por favor, analise-o e responda às perguntas subsequentes ou forneça um resumo, conforme apropriado."
        
        patient_db.add_message_to_history(patient_id, "user", context_message_for_pdf) # Ou "system"
        
        ai_response_text = gemini_connection.send_message(patient_id, context_message_for_pdf)
        patient_db.add_message_to_history(patient_id, "model", ai_response_text)

        response_data = {
            "status": "success",
            "message": "Texto extraído e enviado para a IA com sucesso.",
            "extracted_text_preview": extracted_text[:200] + "...", # Apenas uma prévia
            "ai_response": ai_response_text
        }
        if new_patient_id_generated:
            response_data["patient_id"] = new_patient_id_generated
            
        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Erro interno ao processar o PDF: {e}"}), 500

if __name__ == '__main__':
    print("Servidor Flask com Gemini e DB de Paciente iniciado.")
    app.run(host='0.0.0.0', port=3001, debug=True)