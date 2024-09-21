@echo off

set name=%1
set fps=%2

ffmpeg -framerate %fps% -i "./out/%name%/frame_%%d.png" -i "./music/%name%.wav" -shortest -c:a aac -c:v libx264 -pix_fmt yuv420p "./out/%name%/out.mp4" -y