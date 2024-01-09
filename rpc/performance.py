from typing import Optional
from pylon.core.tools import web, log
from pydantic import parse_obj_as, ValidationError

from ..models.integration_pd import PerformanceBackendTestModel, PerformanceUiTestModel

from tools import rpc_tools


class RPC:
    integration_name = 'aws_integration'

    @web.rpc(f'backend_performance_test_create_integration_validate_{integration_name}')
    @rpc_tools.wrap_exceptions(ValidationError)
    def backend_performance_test_create_integration_validate(self, data: dict, 
            pd_kwargs: Optional[dict] = None, **kwargs
    ) -> dict:
        if not pd_kwargs:
            pd_kwargs = {}
        log.info(f"before validation {data=}")
        project_id = data.get('project_id')
        integration = self.context.rpc_manager.call.integrations_get_by_id(project_id, data["id"])
        pd_object = PerformanceBackendTestModel(**{**integration.settings, **data})
        pd_object.aws_secret_access_key = pd_object.aws_secret_access_key.value
        return pd_object.dict(**pd_kwargs)

    @web.rpc(f'backend_performance_execution_json_config_{integration_name}')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def backend_make_execution_json_config(self, integration_data: dict) -> dict:
        """ Prepare execution_json for this integration """
        integration = self.context.rpc_manager.call.integrations_get_by_id(integration_data["project_id"], integration_data["id"])
        integration_data["aws_access_key"] = integration.settings["aws_access_key"]
        integration_data["aws_secret_access_key"] = integration.settings["aws_secret_access_key"]["value"]
        return integration_data

    @web.rpc(f'ui_performance_test_create_integration_validate_{integration_name}')
    @rpc_tools.wrap_exceptions(ValidationError)
    def ui_performance_test_create_integration_validate(self, data: dict, 
            pd_kwargs: Optional[dict] = None,
            **kwargs
    ) -> dict:
        if not pd_kwargs:
            pd_kwargs = {}
        project_id = data.get('project_id')
        integration = self.context.rpc_manager.call.integrations_get_by_id(project_id, data["id"])
        pd_object = PerformanceUiTestModel(**{**integration.settings, **data})
        pd_object.aws_secret_access_key = pd_object.aws_secret_access_key.value
        return pd_object.dict(**pd_kwargs)

    @web.rpc(f'ui_performance_execution_json_config_{integration_name}')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def ui_make_execution_json_config(self, integration_data: dict) -> dict:
        """ Prepare execution_json for this integration """
        return integration_data
