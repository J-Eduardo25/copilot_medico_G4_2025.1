import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
from vosk import Model, KaldiRecognizer
import json
import queue
import time

# ====== GRAVAR ÁUDIO ======
fs = 16000  # **Atenção**: VOSK recomenda 16000 Hz
q = queue.Queue()

def listener():
    recording = True 
    channels = 1
    dtype = 'int16'
    i = 50 # variável de controle para gravar por 5 segundos

    def callback(indata, frames, time, status):
        if status:
            print(status)
        q.put(indata.copy())

    # print("Gravando... Pressione Enter para parar.")
    print("Gravando...")

    with sd.InputStream(samplerate=fs, channels=channels, dtype=dtype, callback=callback):
        while recording:
            time.sleep(0.1)  # espera um pouco para não travar o loop
            i-=1
            if i == 0:
                recording = False
        print("Parando gravação...")

    # Concatenar blocos
    recording = np.concatenate(list(q.queue))

    # Salvar o áudio
    wav.write('output.wav', fs, recording)
    print("Gravação finalizada!")

    # ====== CONFIGURAR VOSK ======
    model_path = "vosk-model-small-pt-0.3"  # Coloque o caminho da pasta do modelo aqui
    model = Model(model_path)

    # Criar reconhecedor
    rec = KaldiRecognizer(model, fs)

    # ====== CARREGAR ÁUDIO GRAVADO ======
    # Ler o arquivo WAV
    _, audio_data = wav.read('output.wav')

    # Converter para bytes
    audio_bytes = audio_data.tobytes()

    # Processar áudio
    if rec.AcceptWaveform(audio_bytes):
        result = rec.Result()
    else:
        result = rec.FinalResult()

    # Mostrar transcrição
    text = json.loads(result).get('text', '')
    print("Transcrição:", text)


listener()