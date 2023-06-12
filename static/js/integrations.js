const AwsIntegration = {
    delimiters: ['[[', ']]'],
    props: ['instance_name', 'display_name', 'logo_src', 'section_name'],
    emits: ['update'],
    template: `
<div
        :id="modal_id"
        class="modal modal-small fixed-left fade shadow-sm" tabindex="-1" role="dialog"
        @dragover.prevent="modal_style = {'height': '300px', 'border': '2px dashed var(--basic)'}"
        @drop.prevent="modal_style = {'height': '100px', 'border': ''}"
>
    <ModalDialog
            v-model:name="config.name"
            v-model:is_shared="config.is_shared"
            v-model:is_default="is_default"
            @update="update"
            @create="create"
            :display_name="display_name"
            :id="id"
            :is_fetching="is_fetching"
            :is_default="is_default"
    >
        <template #body>
            <div class="form-group">
                <p class="font-h5 font-semibold mb-1">Access Key</p>
                <input type="text" 
                       v-model="aws_access_key" 
                       class="form-control form-control-alternative"
                       placeholder="Access key for your IAM user"
                       :class="{ 'is-invalid': error.aws_access_key }">
                <div class="invalid-feedback">[[ error.aws_access_key ]]</div>
                <p class="font-h5 font-semibold mb-1 mt-3">Secret Access Key </p>
                 <SecretFieldInput 
                        v-model="aws_secret_access_key"
                        placeholder="Secret access key for your IAM user"
                 />
                <div class="invalid-feedback">[[ error.aws_secret_access_key ]]</div>
                <p class="font-h5 font-semibold mb-1 mt-3">AWS Region</p>
                <input type="text" class="form-control form-control-alternative"
                       v-model="region_name"
                       placeholder="AWS region, for example: eu-central-1"
                       :class="{ 'is-invalid': error.region_name }">
                <div class="invalid-feedback">[[ error.region_name ]]</div>
                
                <p class="font-h5 font-semibold mb-1 mt-3">Security groups<span class="text-gray-600 font-h6 font-weight-400 ml-1">(optional)</span></p>
                <input type="text" class="form-control form-control-alternative"
                       v-model="security_groups"
                       placeholder="AWS security groups, coma-separated list"
                       :class="{ 'is-invalid': error.security_groups }">
                <div class="invalid-feedback">[[ error.security_groups ]]</div>
                
                <p class="font-h5 font-semibold mb-1 mt-3">Image ID<span class="text-gray-600 font-h6 font-weight-400 ml-1">(optional)</span></p>
                <input type="text" class="form-control form-control-alternative"
                       v-model="image_id"
                       placeholder="AWS AMI ID for ec2 fleet"
                       :class="{ 'is-invalid': error.image_id }">
                <div class="invalid-feedback">[[ error.image_id ]]</div>
                <p class="font-h5 font-semibold mb-1 mt-3">Key pair name<span class="text-gray-600 font-h6 font-weight-400 ml-1">(optional)</span></p>                
                <input type="text" class="form-control form-control-alternative"
                       v-model="key_name"
                       placeholder="Key pair name"
                       :class="{ 'is-invalid': error.key_name }">
                <div class="invalid-feedback">[[ error.key_name ]]</div>
            </div>
        </template>
        <template #footer>
            <test-connection-button
                    :apiPath="this.$root.build_api_url('integrations', 'check_settings') + '/' + pluginName"
                    :error="error.check_connection"
                    :body_data="body_data"
                    v-model:is_fetching="is_fetching"
                    @handleError="handleError"
            >
            </test-connection-button>
        </template>

    </ModalDialog>
</div>
    `,
    data() {
        return this.initialState()
    },
    mounted() {
        this.modal.on('hidden.bs.modal', e => {
            this.clear()
        })
    },
    computed: {
        project_id() {
            return getSelectedProjectId()
        },
        body_data() {
            const {
                aws_access_key,
                aws_secret_access_key,
                region_name,
                security_groups,
                image_id,
                key_name,
                project_id,
                is_default,
                config,
                status,
                mode
            } = this
            return {
                aws_access_key,
                aws_secret_access_key,
                region_name,
                security_groups,
                image_id,
                key_name,
                project_id,
                is_default,
                config,
                status,
                mode
            }
        },
        modal() {
            return $(this.$el)
        },
        modal_id() {
            return `${this.instance_name}_integration`
        }
    },
    methods: {
        clear() {
            Object.assign(this.$data, this.initialState())
        },
        load(stateData) {
            Object.assign(this.$data, stateData)
        },
        handleEdit(data) {
            const {config, is_default, id, settings} = data
            this.load({...settings, config, is_default, id})
            this.modal.modal('show')
        },
        handleDelete(id) {
            this.load({id})
            this.delete()
        },
        create() {
            this.is_fetching = true
            fetch(this.api_url + this.pluginName, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this.body_data)
            }).then(response => {
                this.is_fetching = false
                if (response.ok) {
                    this.modal.modal('hide')
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                } else {
                    this.handleError(response)
                }
            })
        },
        handleError(response) {
            try {
                response.json().then(
                    errorData => {
                        errorData.forEach(item => {
                            this.error = {[item.loc[0]]: item.msg}
                        })
                    }
                )
            } catch (e) {
                alertMain.add(e, 'danger-overlay')
            }
        },
        update() {
            this.is_fetching = true
            fetch(this.api_url + this.id, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this.body_data)
            }).then(response => {
                this.is_fetching = false
                if (response.ok) {
                    this.modal.modal('hide')
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                } else {
                    this.handleError(response)
                }
            })
        },
        delete() {
            this.is_fetching = true
            fetch(this.api_url + this.id, {
                method: 'DELETE',
            }).then(response => {
                this.is_fetching = false

                if (response.ok) {
                    this.$emit('update', {...this.$data, section_name: this.section_name})
                } else {
                    this.handleError(response)
                    alertMain.add(`
                        Deletion error. 
                        <button class="btn btn-primary" 
                            onclick="vueVm.registered_components.${this.instance_name}.modal.modal('show')"
                        >
                            Open modal
                        <button>
                    `)
                }
            })
        },

        initialState: () => ({
            modal_style: {'height': '100px', 'border': ''},
            aws_access_key: '',
            aws_secret_access_key: '',
            region_name: '',
            security_groups: '',
            key_name: '',
            image_id: '',
            is_default: false,
            is_fetching: false,
            config: {},
            error: {},
            id: null,
            pluginName: 'aws_integration',
            api_url: V.build_api_url('integrations', 'integration') + '/',
            status: integration_status.success,
            mode: V.mode
        })
    }
}

register_component('AwsIntegration', AwsIntegration)
