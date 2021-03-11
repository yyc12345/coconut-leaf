import math

print('Dial Plate Generator')
plateSize = float(input('Plate size: '))
hourInnerRadius = float(input('Hour inner radius percent (float): '))
hourOutterRadius = float(input('Hour outter radius percent (float): '))
minuteRadius = float(input('Minute radius percent (float): '))

halfPlateSize = plateSize / 2
for i in range(24):
    rad = math.radians(90 - i * 30)
    x = math.cos(rad)
    y = math.sin(rad)
    radius = halfPlateSize * (hourOutterRadius if i < 12 else hourInnerRadius)
    x = x * radius + halfPlateSize
    y = (-y * radius) + halfPlateSize
    print('<text x="{:.6f}" y="{:.6f}">{}</text>'.format(x, y, i))

print('')

for i in range(12):
    rad = math.radians(90 - i * 30)
    x = math.cos(rad)
    y = math.sin(rad)
    radius = minuteRadius * halfPlateSize
    x = x * radius + halfPlateSize
    y = (-y * radius) + halfPlateSize
    print('<text x="{:.6f}" y="{:.6f}">{}</text>'.format(x, y, i * 5))

