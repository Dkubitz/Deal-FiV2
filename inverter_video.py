from moviepy.editor import VideoFileClip, concatenate_videoclips, vfx
import os

# Caminho do vídeo original
caminho_video = r"C:\Users\david\OneDrive\Documentos\02_Python Scripts\SmartContractsBrasil\escrow-dapp\frontend\video_pronto.mp4"

# Extrai diretório e nomes
diretorio, nome_arquivo = os.path.split(caminho_video)
nome, ext = os.path.splitext(nome_arquivo)
novo_nome = f"{nome}_pingpong{ext}"
caminho_saida = os.path.join(diretorio, novo_nome)

# Carrega o vídeo
clip = VideoFileClip(caminho_video)

# Cria a versão invertida
clip_invertido = clip.fx(vfx.time_mirror)

# Tempo de transição em segundos (crossfade)
transicao = 0.5

# Concatena normal + reverso, com sobreposição suave
pingpong = concatenate_videoclips(
    [clip.crossfadeout(transicao), clip_invertido.crossfadein(transicao)],
    method="compose"
)

# Exporta o vídeo final sem áudio (ideal para background)
pingpong.write_videofile(caminho_saida, codec="libx264", audio=False, preset="medium", threads=4)

print(f"Ping-pong gerado em: {caminho_saida}")
