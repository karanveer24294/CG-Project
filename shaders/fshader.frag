#version 330 core

in vec3 fColor;
in vec2 fUV;
in vec3 fWorldSpaceCoord;

uniform float time;

out vec4 outColor;

precision mediump float;

float NoiseResolution = 234237483.0;

vec3 RED = vec3(1.0, 0.0, 0.0);
vec3 YELLOW = vec3(0.0, 1.0, 1.0);
vec3 BLUE = vec3(0.0, 0.0, 1.0);
vec3 GREEN = vec3(0.0, 1.0, 0.0);


uint seed = 8274863u;
uint pcgRand(uint x){
	uint s = 723848398u * x + 239034238u;
	s = ((s >> ((s >> 28u) + 4u)) ^ s) + 234239094u;
	s = (s >> 28u) ^ s;
	return s;
}
float rand01(float x){
	return float(pcgRand(uint(int(floor(x))))) / 4294967295.0;
}

float getExpFalloff(float inp){
	return exp(inp) / exp(1.0);
}

// int valueNoise(vec2 p){
// 	uint a = floor(p.x);
// 	uint b = floor(p.y);
// 	uint c = ceil(p.x);
// 	uint d = ceil(p.y);
//
// 	float h1 = float(mod(pcgRand(a), int(NoiseResolution))) / NoiseResolution;
// 	float h2 = float(mod(pcgRand(b), int(NoiseResolution))) / NoiseResolution;
// 	float h3 = float(mod(pcgRand(c), int(NoiseResolution))) / NoiseResolution;
// 	float h3 = float(mod(pcgRand(d), int(NoiseResolution))) / NoiseResolution;
// 	// nooooo this will lead to neighbourun cells having related values..
//
// }


vec2 hash2(vec2 p) {
    p = vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlinNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Quintic interpolation curve
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    // Gradient vectors at the four corners
    float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    // Bilinear interpolation with smooth weights
    float x1 = mix(a, b, u.x);
    float x2 = mix(c, d, u.x);

    float n = mix(x1, x2, u.y);

    // Remap approximately to 0..1
    return 0.5 + 0.5 * n;
}




float fbm_pn(vec2 p, uint num_octaves){
	float sum = 0.0;
	float a = 0.5;
	float ta = 0.0;
	for(uint i = 0u; i < num_octaves; i++){
		sum += a * perlinNoise(p);
		ta += a;
		p *= 2.0;
		a *= 0.5;
	}

	return sum / ta;
}


// brick vars
float v_tile_size = 1.5;
float v_indent = 0.3;
float h_tile_size = 4.0;
float h_indent = (v_tile_size * v_indent) / h_tile_size;

vec3 brick_texture(){
	// vec3 jitter = vec3(
	// 	hash2(fWorldSpaceCoord.xy).x,
	// 	hash2(fWorldSpaceCoord.yz).x,
	// 	hash2(fWorldSpaceCoord.zx).x
	// );
	//
	// vec3 jittered_world_coord =
	// 		fWorldSpaceCoord + 0.1 * jitter;

	vec3 jittered_world_coord = fWorldSpaceCoord ;
	float basefbm = fbm_pn(fUV * 16.0, 2u) * fbm_pn(fUV * 128.0, 4u);

	vec3 base_col = vec3(0.7373, 0.3098, 0.0941);
	base_col *= basefbm;
	vec3 green = vec3(0.6902, 0.9882, 0.4745);
	// green *= fbm_pn(fUV * 8.0, 4u);
	basefbm = fbm_pn((fUV * 32.0) + vec2(1232.1123, 3232.123), 2u) * fbm_pn((fUV * 64.0) + vec2(24233.2334, 2534.342), 2u);
	green *= basefbm;
	// green *= fbm_pn(fUV * 64.0, 4u);
	vec3 finalCol = vec3(0.0);
	finalCol = base_col;
	// if we want moss irrespective of location
	// if(length(green) * 1.05 > length(base_col)){
	// 	finalCol = green * 0.4;
	// } else if(length(green) * 1.15 > length(base_col)){
	// 	finalCol = green * 0.2;
	// }
	



	// now add planes

	float pnt = mod(jittered_world_coord.y, v_tile_size);
	if(pnt < v_tile_size * v_indent){
		pnt = abs(pnt - v_tile_size * v_indent * 0.5);
		pnt /= v_tile_size * v_indent * 0.5;
		// pnt = getExpFalloff(getExpFalloff(pnt));
		pnt = pow(pnt, 0.3);
		finalCol *= 1.0 * pnt;
	}

	float row = floor((jittered_world_coord.y / v_tile_size) - (v_indent * 0.5));
	pnt = mod(jittered_world_coord.z + rand01(row) * 5.0 * h_tile_size * sin(123134.3423), h_tile_size);
	if(pnt < h_tile_size * h_indent){
		pnt = abs(pnt - h_tile_size * h_indent * 0.5);
		pnt /= h_tile_size * h_indent * 0.5;
		// pnt = getExpFalloff(getExpFalloff(pnt));
		pnt = pow(pnt, 0.3);
		finalCol *= 1.0 * pnt;
	}

	// not fbmming this
	//
	float val_moss = fbm_pn(fUV * 32.0, 2u); 

	if(length(finalCol) > 0.15){
		if(val_moss > 0.55){
			finalCol = green * 0.3;
		}
	}else{
		// darker moss in the mortar
		if(val_moss > 0.45){
			finalCol = green * 0.2;
		}
	}

		
	return finalCol ;
}



void main(void) {
	if(length(fColor - RED) < 0.01){
		outColor = vec4(fColor * fbm_pn(fUV * 64.0, 12u), 1.0);
	}else if(length(fColor - BLUE) < 0.01){
		outColor = vec4(brick_texture(), 1.0);
	} else {
		outColor = vec4(vec3(0.0), 1.0);
	}
}
