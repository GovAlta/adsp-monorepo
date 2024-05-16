export const template = `

<body>
    <div class="content">
        <h3>Form summary for form {{content.config.id}} </h3>
        <div class="review-item">
            {{#each content.config.uiSchema.elements }}
                {{#if (isControl this)}}
                    <div class="review-item-basic">
                        {{> elements element=this data=@root.content.data requiredFields=(requiredField @root.content.config.dataSchema) }}
                    </div>
                {{else}}
                    <div class="review-item-section">
                        <div class="review-item-header">
                            <div class="review-item-title">{{this.label}}</div>
                        </div>
                        <div class="grid">
                        {{#each this.elements }}
                            {{> elements element=this data=@root.content.data requiredFields=(requiredField @root.content.config.dataSchema) styles=@root.content.styles }}
                        {{/each}}
                        </div>
                    </div>
                {{/if}}
            {{/each}}
        </div>
        <div>
            <b>Status: </b> {{content.form.status}}
            <h4>Disposition states </h4>
            <ol>
            {{#each content.config.dispositionStates}}
                <li>{{this.name}}</b>: {{this.description}}</li>
            {{/each}}
            </ol>
        </div>
    </div>
</body>

`;
