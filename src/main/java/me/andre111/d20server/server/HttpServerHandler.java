package me.andre111.d20server.server;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.DecoderResult;
import io.netty.handler.codec.TooLongFrameException;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponse;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.LastHttpContent;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.multipart.DefaultHttpDataFactory;
import io.netty.handler.codec.http.multipart.FileUpload;
import io.netty.handler.codec.http.multipart.HttpDataFactory;
import io.netty.handler.codec.http.multipart.HttpPostRequestDecoder;
import io.netty.handler.codec.http.multipart.InterfaceHttpData;
import me.andre111.d20common.D20Common;
import me.andre111.d20common.model.Entity;
import me.andre111.d20common.util.DataUtils;
import me.andre111.d20common.util.Utils;
import me.andre111.d20server.service.ModuleService;
import me.andre111.d20server.util.ImageUtil;

//TODO: correct mime types, correct caching with modified timestamp comparison (see netty examples)
public class HttpServerHandler extends SimpleChannelInboundHandler<FullHttpRequest> {
	private static final String IMAGE_PATH = "/image/";
	private static final String UPLOAD_IMAGE_PATH = "/upload/image";
	private static final String AUDIO_PATH = "/audio/";
	private static final String UPLOAD_AUDIO_PATH = "/upload/audio";
	private static final String COLOR_IMAGE_PATH = "/color/";
	
	private static record Static(String path, File baseDir) {};
	private static List<Static> statics = new ArrayList<>();
	private static String index = "";
	static {
		statics.add(new Static("/core/common/", new File("./core/common/")));
		statics.add(new Static("/core/client/", new File("./core/client/")));
		statics.add(new Static("/core/files/", new File("./core/files/")));
	}
	public static void initModules() {
		StringBuilder moduleScripts = new StringBuilder();
		StringBuilder moduleStyles = new StringBuilder();
		StringBuilder moduleLibraries = new StringBuilder();
		ModuleService.enabledModules().forEach(module -> {
			statics.add(new Static("/modules/"+module.getIdentifier()+"/common/", new File(module.getDirectory(), "/common/")));
			statics.add(new Static("/modules/"+module.getIdentifier()+"/client/", new File(module.getDirectory(), "/client/")));
			statics.add(new Static("/modules/"+module.getIdentifier()+"/files/", new File(module.getDirectory(), "/files/")));
			
			moduleScripts.append("        <script src=\"/modules/"+module.getIdentifier()+"/client/module.js\" type=\"module\"></script>\n");
			moduleStyles.append("        <link rel=\"stylesheet\" href=\"/modules/"+module.getIdentifier()+"/files/module.css\">\n");
			if(module.getDefinition().libraries() != null) {
				for(String library : module.getDefinition().libraries()) {
					moduleLibraries.append("        <script src=\"/modules/"+module.getIdentifier()+"/files"+library+"\"></script>\n");
				}
			}
		});
		
		try {
			index = Files.readString(new File("./core/index.html").toPath());
			index = index.replace("!MODULE_SCRIPTS!", moduleScripts.toString());
			index = index.replace("!MODULE_STYLES!", moduleStyles.toString());
			index = index.replace("!MODULE_LIBRARIES!", moduleLibraries.toString());
		} catch (IOException e) {
			// TODO Auto-generated catch block
			throw new RuntimeException(e);
		}
	}
	
	private static final HttpDataFactory factory = new DefaultHttpDataFactory(false);
	private HttpPostRequestDecoder decoder;
	private String uploadPath;

	@Override
	public void channelRead0(ChannelHandlerContext ctx, FullHttpRequest msg) throws Exception {
		handleMessageReceived(ctx, msg);
	}

	private void handleMessageReceived(ChannelHandlerContext ctx, FullHttpRequest msg) throws UnsupportedEncodingException {
		// only allow get
		if (msg.method() == HttpMethod.GET) {
			handleGET(ctx, msg);
		} else if(msg.method() == HttpMethod.POST) {
			handlePOST(ctx, msg);
		} else {
			sendError(ctx, HttpResponseStatus.METHOD_NOT_ALLOWED);
			return;
		}
	}

	private void handleGET(ChannelHandlerContext ctx, FullHttpRequest request) throws UnsupportedEncodingException {
		// read and check path
		QueryStringDecoder decoder = new QueryStringDecoder(URLDecoder.decode(request.uri(), "UTF-8"));
		String path = decoder.path();
		if (!isValidPath(path)) {
			sendError(ctx, HttpResponseStatus.NOT_FOUND);
			return;
		}

		// response variables
		byte[] data = null;
		String contentType = null;

		// provide images
		if(path.isBlank() || path.equals("/")) {
			data = index.getBytes();
			contentType = "text/html";
		} else if(path.startsWith(IMAGE_PATH)) {
			String idString = path.substring(IMAGE_PATH.length());
			long id = Long.parseLong(idString);
			Entity image = D20Common.getEntityManager("image").find(id);
			if(image != null) {
				data = Utils.readBinary("entity.image."+id);
				if(decoder.parameters().containsKey("grayscale") && decoder.parameters().get("grayscale").get(0).equals("1")) {
					data = ImageUtil.toGrayscale(data); //TODO: this might need to be cached as a file
				}
				contentType = "image/png";
			}
		} else if(path.startsWith(AUDIO_PATH)) {
			String idString = path.substring(AUDIO_PATH.length());
			long id = Long.parseLong(idString);
			Entity audio = D20Common.getEntityManager("audio").find(id);
			if(audio != null) {
				data = Utils.readBinary("entity.audio."+id);
				contentType = "application/ogg";
			}
		} else if(path.startsWith(COLOR_IMAGE_PATH)) {
			try {
				int color = Integer.parseInt(path.substring(COLOR_IMAGE_PATH.length()));
				data = ImageUtil.createColorImage(color, 16, 2);
				contentType = "image/png";
			} catch(NumberFormatException e) {
			}
		} else {
			// static hosted files
			for(Static s : statics) {
				if(path.startsWith(s.path)) {
					String filePath = path.substring(s.path.length());
					File file = new File(s.baseDir, filePath);
					if(file != null && file.exists() && file.toPath().toAbsolutePath().startsWith(s.baseDir.toPath().toAbsolutePath())) {
						data = Utils.readBinary(file);
						contentType = ""; //TODO: somehow set this correctly?
						if(path.endsWith(".js")) contentType = "application/javascript";
						if(path.endsWith(".css")) contentType = "text/css";
						if(path.endsWith(".png")) contentType = "image/png";
					}
				}
			}
		}

		// send response
		if(data == null) {
			sendError(ctx, HttpResponseStatus.NOT_FOUND);
			return;
		}
		
		

		// write
		int dataStart = 0;
		int dataEnd = data.length-1;
		int dataLength = data.length;
		boolean addAcceptRanges = false;
		
		// check range header and reply accordingly
		HttpHeaders headers = request.headers();
		String range = headers.get(HttpHeaderNames.RANGE);
		if(range != null && range.startsWith("bytes=")) {
			addAcceptRanges = true;
			
			String[] split = range.substring("bytes=".length()).split("-", 2);
			dataStart = Integer.parseInt(split[0]);
			if(split.length == 2 && !split[1].isBlank()) dataEnd = Integer.parseInt(split[1]);
			else dataEnd = dataStart + 0xFFFF;
			
			if(dataEnd > dataLength-1) dataEnd = dataLength-1;

			if(dataStart != 0 || dataEnd != dataLength-1) {
				data = Arrays.copyOfRange(data, dataStart, dataEnd+1);
			}
		}
		
		// write content
		HttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, addAcceptRanges ? HttpResponseStatus.PARTIAL_CONTENT : HttpResponseStatus.OK, Unpooled.wrappedBuffer(data));
		if(addAcceptRanges) {
			response.headers().set(HttpHeaderNames.ACCEPT_RANGES, "bytes");
			response.headers().set(HttpHeaderNames.CONTENT_RANGE, "bytes "+dataStart+"-"+dataEnd+"/"+dataLength);
		}
		response.headers().set(HttpHeaderNames.CONTENT_LENGTH, data.length);
		response.headers().set(HttpHeaderNames.CONTENT_TYPE, contentType);
		if (!HttpUtil.isKeepAlive(request)) {
			response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
		} else if (request.protocolVersion().equals(HttpVersion.HTTP_1_0)) {
			response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
		}

		ChannelFuture writeFuture = ctx.writeAndFlush(response);
		if(!HttpUtil.isKeepAlive(request)) {
			writeFuture.addListener(ChannelFutureListener.CLOSE);
		}
	}

	private void handlePOST(ChannelHandlerContext ctx, FullHttpRequest request) throws UnsupportedEncodingException {
		// read and check path
		String path = URLDecoder.decode(request.uri(), "UTF-8");
		if(path == null || (!path.startsWith(UPLOAD_IMAGE_PATH) && !path.startsWith(UPLOAD_AUDIO_PATH))) {
			sendError(ctx, HttpResponseStatus.NOT_FOUND);
			return;
		}
		uploadPath = path;
		
		DecoderResult result = request.decoderResult();
		if(result.isSuccess()) {
			// create decoder
			if(decoder != null) {
				decoder.destroy();
				decoder = null;
			}
			decoder = new HttpPostRequestDecoder(factory, request);
			
			if(decoder != null) {
				// read data from decoder
				while(decoder.hasNext()) {
					InterfaceHttpData data = decoder.next();
					switch(data.getHttpDataType()) {
					case FileUpload:
						FileUpload fileUpload = (FileUpload) data;
						if(fileUpload.isCompleted()) {
							try {
								if(uploadPath.startsWith(UPLOAD_IMAGE_PATH)) {
									String imageName = fileUpload.getFilename();
									byte[] imageData = fileUpload.get();
									if(DataUtils.isValidImage(imageData)) {
										Entity image = new Entity("image");
										image.prop("name").setString(imageName);
										Utils.saveBinary("entity.image."+image.id(), imageData);
										D20Common.getEntityManager("image").add(image);
									}
								} else if(uploadPath.startsWith(UPLOAD_AUDIO_PATH)) {
									String audioName = fileUpload.getFilename();
									byte[] audioData = fileUpload.get();
									if(DataUtils.isValidAudio(audioData)) {
										Entity audio = new Entity("audio");
										audio.prop("name").setString(audioName);
										Utils.saveBinary("entity.audio."+audio.id(), audioData);
										D20Common.getEntityManager("audio").add(audio);
									}
								}
							} catch (IOException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
							}
						}
						break;
					default:
						System.out.println("Unhandled post data type: "+data.getHttpDataType());
						break;
					}
				}

				if(request instanceof LastHttpContent) {
					FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK);
					ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);

					// reset decode
					decoder.destroy();
					decoder = null;
				}
			}
		}
	}

	private boolean isValidPath(String path) {
		return path != null;
	}

	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
		Channel ch = ctx.channel();
		if (cause instanceof TooLongFrameException) {
			sendError(ctx, HttpResponseStatus.BAD_REQUEST);
			return;
		}

		cause.printStackTrace();
		if (ch.isActive()) {
			sendError(ctx, HttpResponseStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private void sendError(ChannelHandlerContext ctx, HttpResponseStatus status) {
		ByteBuf data = Unpooled.copiedBuffer("Failure: " + status.toString() + "\r\n", StandardCharsets.UTF_8);

		DefaultFullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, data);
		response.headers().set("Content-Type", "text/plain; charset=UTF-8");

		Channel channel = ctx.channel();
		channel.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
	}
}
