package me.andre111.d20server.template;

public final class TemplateComponentText extends TemplateComponent {
	private final String string;
	
	public TemplateComponentText(String string) {
		this.string = string;
	}
	
	@Override
	public String getString() {
		return string;
	}
}
