#version 330 core

in vec3 vVertex;
in vec3 vColor;
in vec2 vUV;

uniform mat4 vModel;
uniform mat4 vView;
uniform mat4 vProjection;

out vec3 fColor;
out vec2 fUV;
out vec3 fWorldSpaceCoord;

void main() {
	gl_Position = vProjection * vView * vModel * vec4(vVertex, 1.0);
	fColor = vColor; //Interpolate color
	fUV = vUV;
	fWorldSpaceCoord = (vModel * vec4(vVertex, 1.0)).xyz;
}
