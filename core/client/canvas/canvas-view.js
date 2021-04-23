export class CanvasView {
    #profile;
    #playerView;
    #renderLights;
    #renderWallOcclusion;
    #renderWallLines;

    #forceWallOcclusion;
    #forceLights;

    constructor(profile, playerView, renderLights, renderWallOcclusion, renderWallLines) {
        this.#profile = playerView ? profile.getUnprivilegedCopy() : profile;
        this.#playerView = playerView;
        this.#renderLights = renderLights;
        this.#renderWallOcclusion = renderWallOcclusion;
        this.#renderWallLines = renderWallLines;
    }

    getProfile() {
        return this.#profile;
    }

    setProfile(profile) {
        this.#profile = this.#playerView ? profile.getUnprivilegedCopy() : profile;
    }

    isPlayerView() {
        return this.#playerView;
    }
    
    doRenderLights() {
        return this.#renderLights || this.#forceLights;
    }
    
    doRenderWallOcclusion() {
        return this.#renderWallOcclusion || this.#forceWallOcclusion;
    }
    
    doRenderWallLines() {
        return this.#renderWallLines;
    }
    
    setForceWallOcclusion(forceWallOcclusion) {
        this.#forceWallOcclusion = forceWallOcclusion;
    }
    
    setForceLights(forceLights) {
        this.#forceLights = forceLights;
    }
}
