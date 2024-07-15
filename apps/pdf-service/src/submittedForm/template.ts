export const template = `

<body>
    <div class="content">
        <h3>Form summary for form {{data.content.config.id}} </h3>
        <div class="review-item">
            {{#each data.content.config.uiSchema.elements }}
                {{#if (isControl this)}}
                    <div class="review-item-basic">
                        {{> elements element=this data=@root.data.content.data requiredFields=(requiredField @root.content.config.dataSchema) }}
                    </div>
                {{else}}
                    <div class="review-item-section">
                        <div class="review-item-header">
                            <div class="review-item-title">{{this.label}}</div>
                        </div>
                        <div class="grid">
                        {{#each this.elements }}
                            {{> elements element=this data=@root.data.content.data requiredFields=(requiredField @root.content.config.dataSchema) styles=@root.content.styles }}
                        {{/each}}
                        </div>
                    </div>
                {{/if}}
            {{/each}}
        </div>
    </div>
</body>

`;
